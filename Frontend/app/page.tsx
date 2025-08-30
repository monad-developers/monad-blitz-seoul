export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* 히어로 섹션 */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* 그라데이션 배경 */}
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]
            before:absolute before:w-full before:h-full before:rounded-full 
            before:bg-gradient-radial before:from-[#744CCC] before:to-transparent 
            before:blur-3xl before:opacity-20 before:animate-pulse
            after:absolute after:w-2/3 after:h-2/3 after:top-1/4 after:left-1/4
            after:bg-gradient-conic after:from-[#744CCC] after:via-[#0141ff] after:to-transparent
            after:blur-3xl after:opacity-30 after:animate-spin after:[animation-duration:20s]"
          />
        </div>

        {/* 컨텐츠 */}
        <div className="relative z-10 text-center px-4">
          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            MusicWithNow
          </h1>
          <p className="text-xl text-gray-400 mb-8">음악으로 하나되는 공간</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/collaborate" 
              className="bg-[#744CCC] hover:bg-[#744CCC]/90 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            >
              시작하기
            </a>
            <a 
              href="/about" 
              className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 backdrop-blur-sm"
            >
              더 알아보기
            </a>
          </div>
        </div>
      </section>

      {/* Discover 섹션 */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Discover Tracks and Playlists</h2>
          
          {/* DEF Showcase */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              MWN Showcase
              <span className="text-orange-500">🔥</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[1,2,3,4,5].map((item) => (
                <div key={item} className="bg-[#111111] rounded-lg p-4 hover:bg-[#1A1A1A] transition-colors group">
                  <div className="aspect-square rounded-lg overflow-hidden mb-4 relative group">
                    <img 
                      src={`https://picsum.photos/400/400?random=${item}`}
                      alt="Track Cover"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-50 transition-opacity" />
                  </div>
                  <h4 className="font-medium mb-1 group-hover:text-[#744CCC] transition-colors">Track Name</h4>
                  <p className="text-sm text-gray-400">Artist Name</p>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Notes */}
          <div>
            <h3 className="text-2xl font-semibold mb-6">Exclusive Voice Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[1,2,3,4,5].map((item) => (
                <div key={item} className="bg-[#111111] rounded-lg p-4 hover:bg-[#1A1A1A] transition-colors group">
                  <div className="aspect-square rounded-lg overflow-hidden mb-4 relative group">
                    <img 
                      src={`https://picsum.photos/400/400?random=${item + 10}`}
                      alt="Voice Note Cover"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-50 transition-opacity" />
                  </div>
                  <h4 className="font-medium mb-1 group-hover:text-[#744CCC] transition-colors">Voice Note Title</h4>
                  <p className="text-sm text-gray-400">Creator Name</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Artists 섹션 */}
      <section className="py-20 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Featured Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[1,2,3,4,5,6].map((item) => (
              <div key={item} className="text-center group">
                <div className="aspect-square rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-[#744CCC] transition-all relative">
                  <img 
                    src={`https://picsum.photos/400/400?random=${item + 20}`}
                    alt="Artist Profile"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="font-medium mb-1 group-hover:text-[#744CCC] transition-colors">Artist Name</h4>
                <p className="text-sm text-gray-400">1.2M Followers</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
