'use client';

import { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../../contexts/Web3Context';
import { uploadToS3, getFileFromS3Url } from '../../../utils/s3';
import { CONTRACT_ADDRESSES, SEPOLIA_GATEWAY_ABI } from '../../../config/web3';
import toast from 'react-hot-toast';

// 주파수 매핑
const NOTES: { [key: string]: number } = {
  'C4': 261.63,
  'E4': 329.63,
  'G4': 392.00,
  'A4': 440.00,
  'C5': 523.25,
};

// 드럼 음원 URL
const DRUM_TRACK = '/drum_track.mp3';
const DRUM_TRACK_2 = '/drum_track_2.mp3';

// 드럼 사운드 버퍼 로드 함수
const loadDrumSample = async (context: AudioContext, url: string): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await context.decodeAudioData(arrayBuffer);
};

// 드럼 사운드 재생 함수
const playDrumSound = async (context: AudioContext, buffer: AudioBuffer, time: number = 0) => {
  const source = context.createBufferSource();
  const gainNode = context.createGain();
  
  source.buffer = buffer;
  gainNode.gain.setValueAtTime(0.5, context.currentTime);
  
  source.connect(gainNode);
  gainNode.connect(context.destination);
  
  source.start(context.currentTime + time);
  return { source, gainNode };
};

// 악기 타입별 사운드 생성 함수
const createOscillator = (context: AudioContext, frequency: number, type: OscillatorType = 'sine') => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  
  gainNode.gain.setValueAtTime(0, context.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  return { oscillator, gainNode };
};

// 클라이언트 사이드 전용 컴포넌트
interface Track {
  id: string;
  type: string;
  description: string;
  audioBlob: Blob;
  createdAt: number;
  name?: string;
}

const WorkPageClient = () => {
  const { isConnected, connectWallet, createMusicProject } = useWeb3();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedTracksForMerge, setSelectedTracksForMerge] = useState<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 이전 페이지에서 업로드된 파일이 있다면 트랙으로 추가
    const addUploadedTrack = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const fileName = searchParams.get('fileName');
      const fileData = localStorage.getItem('uploadedFile');
      
      if (fileName && fileData) {
        const blob = await fetch(fileData).then(r => r.blob());
        const newTrack: Track = {
          id: Date.now().toString(),
          type: 'audio',
          description: '업로드된 음원',
          audioBlob: blob,
          createdAt: Date.now(),
          name: fileName
        };
        setTracks(prev => [...prev, newTrack]);
        localStorage.removeItem('uploadedFile');
      }
    };
    
    addUploadedTrack();
  }, []);
  
  // AudioContext 초기화
  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  useEffect(() => {
    // Listen for project completion events
    const listenToProjectCompletion = async () => {
      if (!window.ethereum) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESSES.SEPOLIA_GATEWAY,
        SEPOLIA_GATEWAY_ABI,
        provider
      );

      // Listen for project creation events
      contract.on('ProjectSentToMonad', (messageId: string, creator: string, s3Url: string, fees: number) => {
        if (creator.toLowerCase() === window.ethereum.selectedAddress?.toLowerCase()) {
          toast.success('프로젝트가 생성되었습니다!');
        }
      });

      // Listen for new contributions
      contract.on('ContributionSentToMonad', (messageId: string, projectId: number, contributor: string, s3Url: string) => {
        toast.success('새로운 기여가 추가되었습니다!');
        getFileFromS3Url(s3Url).then((blob: Blob) => {
          const newTrack: Track = {
            id: Date.now().toString(),
            type: 'audio',
            description: '협업자 기여',
            audioBlob: blob,
            createdAt: Date.now(),
            name: '협업 트랙'
          };
          setTracks(prev => [...prev, newTrack]);
        });
      });

      // Listen for AI remix completion
      contract.on('ProjectRemixedFromMonad', (projectId: number, newMixedUrl: string, versionNumber: number, creator: string) => {
        toast.success(`AI 리믹스 버전 ${versionNumber}이 완료되었습니다!`);
        getFileFromS3Url(newMixedUrl).then((blob: Blob) => {
          const newTrack: Track = {
            id: Date.now().toString(),
            type: 'audio',
            description: `AI 리믹스 버전 ${versionNumber}`,
            audioBlob: blob,
            createdAt: Date.now(),
            name: `AI 리믹스 v${versionNumber}`
          };
          setTracks(prev => [...prev, newTrack]);
        });
      });

      return () => {
        contract.removeAllListeners('ProjectSentToMonad');
        contract.removeAllListeners('ContributionSentToMonad');
        contract.removeAllListeners('ProjectRemixedFromMonad');
      };
    };

    listenToProjectCompletion();

    return () => {
      // Cleanup AudioContext when component unmounts
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  const [selectedTrackType, setSelectedTrackType] = useState<string | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);

  const trackTypes = [
    {
      id: 'software-instrument',
      title: 'Software Instrument',
      color: 'bg-green-500',
      icon: '🎹',
      description: 'USB MIDI 키보드를 연결하여 피아노, 오르간, 신스 등의 다양한 악기를 연주하고 녹음하세요.',
      examples: ['피아노', '오르간', '신스']
    },
    {
      id: 'audio',
      title: 'Audio',
      color: 'bg-blue-500',
      icon: '🎤',
      description: '마이크나 라인 입력을 사용하여 녹음하거나 오디오 파일을 드래그 앤 드롭하세요.',
      examples: ['마이크 녹음', '기타/베이스', '오디오 파일']
    },
    {
      id: 'drummer',
      title: 'Drummer',
      color: 'bg-orange-500',
      icon: '🥁',
      description: '노래에 자동으로 맞춰 연주하는 드러머를 추가하세요.',
      examples: ['자동 드럼', '비트 생성']
    }
  ];

  const generateAudio = async (instrument: string, desc: string) => {
    try {
      setIsGenerating(true);
      const context = initializeAudioContext();
      
      if (context.state === 'suspended') {
        await context.resume();
      }

      // 오디오 스트림 생성을 위한 Destination 노드
      const dest = context.createMediaStreamDestination();
      
      // MediaRecorder 설정
      mediaRecorderRef.current = new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const newTrack: Track = {
          id: Date.now().toString(),
          type: instrument,
          description: desc,
          audioBlob: blob,
          createdAt: Date.now()
        };
        setTracks(prev => [...prev, newTrack]);
        setCurrentTrackId(newTrack.id);
        setAudioBlob(blob);
        if (audioRef.current) {
          audioRef.current.src = URL.createObjectURL(blob);
        }
      };

      // 녹음 시작
      mediaRecorderRef.current.start();

      // 악기 타입별 설정
      let time = 0;
      const interval = 0.5;

      if (instrument === 'drummer') {
        try {
          // 3초 대기 후 드럼 트랙 재생
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // 설명에 따라 다른 드럼 트랙 선택
          const selectedDrumTrack = desc === '더 멋있는' ? DRUM_TRACK_2 : DRUM_TRACK;
          const drumBuffer = await loadDrumSample(context, selectedDrumTrack);
          const source = context.createBufferSource();
          const gainNode = context.createGain();
          
          source.buffer = drumBuffer;
          gainNode.gain.setValueAtTime(0.7, context.currentTime); // 볼륨 조절
          
          source.connect(gainNode);
          gainNode.connect(context.destination);
          gainNode.connect(dest); // 녹음을 위해 destination에도 연결
          
          source.start(context.currentTime);
          time = drumBuffer.duration; // 전체 트랙 길이로 설정
        } catch (error) {
          console.error('드럼 트랙 재생 실패:', error);
          throw error;
        }
      } else {
        // 다른 악기들을 위한 기존 로직
        let oscillatorType: OscillatorType = 'sine';
        let noteSequence: number[] = [];
        
        if (instrument === 'software-instrument') {
          oscillatorType = 'sine';
          noteSequence = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5];
        } else {
          oscillatorType = 'triangle';
          noteSequence = [NOTES.C4, NOTES.E4];
        }

        // 시퀀스 재생
        noteSequence.forEach((frequency) => {
          setTimeout(() => {
            const { oscillator, gainNode } = createOscillator(context, frequency, oscillatorType);
            // 오디오를 녹음 스트림으로도 연결
            gainNode.connect(dest);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.5);
          }, time * 1000);
          time += interval;
        });
      }

      setIsPlaying(true);
      
      // 시퀀스가 끝나면 녹음 중지
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsPlaying(false);
      }, (time + 1) * 1000);

    } catch (error) {
      console.error('Error generating audio:', error);
      alert('음원 생성에 실패했습니다. 다시 시도해주세요.');
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // 재생 중지
  const stopPlayback = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().then(() => {
        audioContextRef.current = null;
        setIsPlaying(false);
      });
    }
    setAudioBlob(null);
  };

  const handleCreateTrack = async () => {
    if (selectedTrackType) {
      try {
        await generateAudio(selectedTrackType, description);
        setShowTrackModal(false);
        setSelectedTrackType(null);
        setDescription('');
      } catch (error) {
        console.error('Failed to create track:', error);
        toast.error('트랙 생성에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleCreateBlockchainProject = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (error) {
        toast.error('지갑 연결에 실패했습니다.');
        return;
      }
    }

    if (tracks.length === 0) {
      toast.error('최소 하나의 트랙이 필요합니다.');
      return;
    }

    try {
      setIsUploading(true);
      toast.loading('프로젝트를 블록체인에 저장하는 중...');

      // Merge all tracks into a single audio file
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = context.createMediaStreamDestination();
      const recorder = new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finalBlob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const mergedBlob = new Blob(chunks, { type: 'audio/wav' });
          resolve(mergedBlob);
        };

        // Start recording
        recorder.start();

        // Play all tracks simultaneously
        Promise.all(tracks.map(async (track) => {
          const audio = new Audio(URL.createObjectURL(track.audioBlob));
          const source = context.createMediaElementSource(audio);
          source.connect(context.destination);
          source.connect(dest);
          return audio.play();
        })).catch(reject);

        // Stop recording after the longest track finishes
        const maxDuration = Math.max(...tracks.map(track => track.audioBlob.size)) / 44100; // Approximate duration
        setTimeout(() => {
          recorder.stop();
          context.close();
        }, (maxDuration + 0.5) * 1000);
      });

      // Upload to S3
      const file = new File([finalBlob], 'merged-project.wav', { type: 'audio/wav' });
      const s3Url = await uploadToS3(file);

      // Create blockchain project
      const messageId = await createMusicProject(s3Url, []);
      
      toast.success('프로젝트가 성공적으로 생성되었습니다!');
      toast.success('AI 처리가 시작되었습니다. 완료되면 알림을 받으실 수 있습니다.');

    } catch (error) {
      console.error('Failed to create blockchain project:', error);
      toast.error('프로젝트 생성에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white" suppressHydrationWarning>
      {/* 상단 컨트롤 바 */}
      <div className="bg-[#1a1a1a] p-4 border-b border-[#333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 재생 컨트롤 */}
            <div className="flex items-center space-x-2">
              <button className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-[#2a2a2a] border border-[#333]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                </svg>
              </button>
              <button 
                onClick={isPlaying ? stopPlayback : () => {}}
                className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center hover:bg-[#2a2a2a] border border-[#333]"
                disabled={!isPlaying}
              >
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 4h4v16h-4zM4 4h4v16H4z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button className="w-8 h-8 bg-[#7c3aed] rounded-full flex items-center justify-center hover:bg-[#6d28d9] border border-[#333]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </button>
              
              {/* 음악 합치기 버튼 */}
              <button 
                onClick={() => {
                  if (tracks.length < 2) {
                    alert('합칠 트랙이 2개 이상 필요합니다.');
                    return;
                  }
                  setShowMergeModal(true);
                  setSelectedTracksForMerge([]);
                }}
                className="ml-4 px-4 py-1.5 bg-[#2a2a2a] hover:bg-[#333] rounded-lg text-sm font-medium transition-colors border border-[#333] flex items-center space-x-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 8v8M8 8v8M12 4v16" />
                </svg>
                <span>음악 합치기</span>
              </button>
            </div>
            
            {/* 템포 및 키 설정 */}
            <div className="flex items-center space-x-4 text-sm">
              <span>Tempo: 120 BPM</span>
              <span>Time: 4/4</span>
              <span>Key: Cmaj</span>
            </div>
          </div>
          

        </div>
      </div>

      {/* 메인 작업 공간 */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">음악 제작 작업공간</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowTrackModal(true)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>새 트랙 추가</span>
            </button>
            <button
              onClick={handleCreateBlockchainProject}
              disabled={isUploading || tracks.length === 0}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isUploading || tracks.length === 0
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[#2a2a2a] hover:bg-[#333] border border-[#333]'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V8H4v4M12 16V4M12 16l-4-4M12 16l4-4" />
              </svg>
              <span>{isUploading ? 'AI 처리 중...' : 'AI 처리 요청'}</span>
            </button>
            <a 
              href="/music" 
              className="bg-[#2a2a2a] hover:bg-[#333] px-6 py-2.5 rounded-lg font-medium transition-colors border border-[#333] flex items-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>뒤로 가기</span>
            </a>
          </div>
        </div>

        {/* 트랙 합치기 모달 */}
        {showMergeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 border border-[#333]">
              <h2 className="text-2xl font-bold mb-6">트랙 선택</h2>
              <p className="text-gray-400 mb-4">합치고 싶은 트랙 2개를 선택해주세요.</p>
              
              <div className="space-y-4 mb-6">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      if (selectedTracksForMerge.includes(track.id)) {
                        setSelectedTracksForMerge(prev => prev.filter(id => id !== track.id));
                      } else if (selectedTracksForMerge.length < 2) {
                        setSelectedTracksForMerge(prev => [...prev, track.id]);
                      }
                    }}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTracksForMerge.includes(track.id)
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-[#7c3aed] border border-[#333]">
                          {track.type === 'software-instrument' ? '🎹' : track.type === 'drummer' ? '🥁' : '🎤'}
                        </div>
                        <div>
                          <h3 className="font-semibold">{track.name || track.type}</h3>
                          <p className="text-gray-400 text-sm">{track.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setSelectedTracksForMerge([]);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (selectedTracksForMerge.length !== 2) {
                      alert('트랙을 2개 선택해주세요.');
                      return;
                    }

                    try {
                      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const dest = context.createMediaStreamDestination();
                      const recorder = new MediaRecorder(dest.stream);
                      const chunks: BlobPart[] = [];

                      recorder.ondataavailable = (e) => {
                        if (e.data.size > 0) chunks.push(e.data);
                      };

                      recorder.onstop = () => {
                        const mergedBlob = new Blob(chunks, { type: 'audio/wav' });
                        const newTrack: Track = {
                          id: Date.now().toString(),
                          type: 'audio',
                          description: '합쳐진 트랙',
                          audioBlob: mergedBlob,
                          createdAt: Date.now(),
                          name: '합쳐진 트랙'
                        };
                        setTracks(prev => [...prev, newTrack]);
                        setShowMergeModal(false);
                        setSelectedTracksForMerge([]);
                      };

                      // 녹음 시작
                      recorder.start();

                      // 선택된 트랙들의 오디오 동시 재생
                      const selectedTracks = tracks.filter(track => selectedTracksForMerge.includes(track.id));
                      const audioElements = await Promise.all(
                        selectedTracks.map(async (track) => {
                          const audio = new Audio(URL.createObjectURL(track.audioBlob));
                          const source = context.createMediaElementSource(audio);
                          source.connect(context.destination);
                          source.connect(dest);
                          return audio;
                        })
                      );

                      // 모든 트랙 동시 재생
                      await Promise.all(audioElements.map(audio => audio.play()));

                      // 가장 긴 트랙의 길이를 기준으로 녹음 종료
                      const maxDuration = Math.max(...audioElements.map(audio => audio.duration));
                      setTimeout(() => {
                        recorder.stop();
                        audioElements.forEach(audio => audio.remove());
                        context.close();
                      }, maxDuration * 1000 + 500); // 0.5초 여유 추가

                    } catch (error) {
                      console.error('Error merging tracks:', error);
                      alert('트랙 합치기에 실패했습니다.');
                    }
                  }}
                  disabled={selectedTracksForMerge.length !== 2}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    selectedTracksForMerge.length === 2
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  합치기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 트랙 타입 선택 모달 */}
        {showTrackModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 border border-[#333]">
              <h2 className="text-2xl font-bold mb-6">트랙 타입 선택</h2>
              
              <div className="space-y-4 mb-6">
                {trackTypes.map((track) => (
                  <div
                    key={track.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTrackType === track.id 
                        ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedTrackType(track.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${track.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {track.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold ${track.color.replace('bg-', 'text-').replace('-500', '-300')}`}>
                          {track.title}
                        </h3>
                        <p className="text-gray-300 text-sm mt-1">{track.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {track.examples.map((example, index) => (
                            <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTrackType && (
                <div className="mt-6 mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    음원 설명
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="원하는 음원의 특성을 자세히 설명해주세요. (예: 밝고 경쾌한 피아노 멜로디, 부드러운 재즈 스타일의 기타 연주 등)"
                    className="w-full h-24 px-3 py-2 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {audioBlob && (
                <div className="mt-4 mb-6 space-y-4">
                  <audio ref={audioRef} controls className="w-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(audioBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedTrackType || 'audio'}-${Date.now()}.wav`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    다운로드
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-gray-400">
                  <span className="text-sm">Details</span>
                  <span>→</span>
                  <span className="text-lg">?</span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowTrackModal(false);
                      setDescription('');
                      stopPlayback();
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateTrack}
                    disabled={!selectedTrackType || !description || isGenerating}
                    className={`px-6 py-2 rounded-lg transition-colors ${
                      selectedTrackType && description && !isGenerating
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? '생성 중...' : '생성'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tracks.length === 0 ? (
          // 작업 공간 안내
                  <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-[#333]">
            <div className="mb-4">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[#7c3aed]">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" strokeLinejoin="round" />
              </svg>
            </div>
          <h3 className="text-xl font-semibold mb-2">AI 음악 제작 도구</h3>
          <p className="text-gray-400 mb-6">
            새 트랙을 추가하여 음악을 제작하거나 AI를 활용한 음원 생성을 시작하세요
          </p>
          <button 
            onClick={() => setShowTrackModal(true)}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] px-8 py-3 rounded-lg font-medium text-lg transition-colors"
          >
            첫 번째 트랙 만들기
          </button>
        </div>
        ) : (
          // 트랙 리스트
          <div className="space-y-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`bg-[#1a1a1a] rounded-lg p-4 border ${
                  currentTrackId === track.id ? 'border-[#7c3aed]' : 'border-[#333]'
                } hover:border-[#7c3aed] transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${
                      track.type === 'software-instrument' ? 'text-[#7c3aed]' :
                      track.type === 'drummer' ? 'text-[#7c3aed]' : 'text-[#7c3aed]'
                    } rounded-lg flex items-center justify-center bg-[#2a2a2a] border border-[#333]`}>
                      {track.type === 'software-instrument' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 18v-12h18v12"></path>
                          <path d="M9 8v8"></path>
                          <path d="M15 8v8"></path>
                        </svg>
                      ) : track.type === 'drummer' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="8"></circle>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20m-8-6l16-4"></path>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {track.name || (
                          track.type === 'software-instrument' ? '소프트웨어 악기' :
                          track.type === 'drummer' ? '드러머' : '오디오'
                        )}
                      </h3>
                      <p className="text-gray-400 text-sm">{track.description || '설명 없음'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <audio
                      controls
                      src={URL.createObjectURL(track.audioBlob)}
                      className="h-8"
                    />
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(track.audioBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${track.type}-${track.createdAt}.wav`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 bg-[#2a2a2a] hover:bg-[#333] rounded-lg border border-[#333] text-[#7c3aed]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// 동적으로 임포트되는 메인 컴포넌트
export default function WorkPage() {
  return <WorkPageClient />;
}
