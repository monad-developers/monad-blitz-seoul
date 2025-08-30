import React, { useState } from 'react';
import { Plus, X, User, Mail, Phone, Wallet, Settings } from 'lucide-react';
import Layout, { GridContainer, GridItem, Card, Button } from './Layout';
import { useEvent } from '../contexts/EventContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEventCsvFields } from '../services/api';

const FieldSettings = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const eventId = location.state?.eventId;
  const [csvFields, setCsvFields] = useState<string[]>([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  
  const { fields = [], updateFields } = useEvent();

  // CSV 필드 자동설정
  React.useEffect(() => {
    if (eventId) {
      setCsvLoading(true);
      setCsvError(null);
      getEventCsvFields(localStorage.getItem('adminToken') || '', eventId)
        .then((fields) => setCsvFields(fields))
        .catch((e) => setCsvError('CSV 필드 정보를 불러오지 못했습니다.'))
        .finally(() => setCsvLoading(false));
    }
  }, [eventId]);

  // 기본 필드/지갑주소/맞춤필드 없이, csvFields만 필드로 사용
  React.useEffect(() => {
    if (csvFields.length > 0) {
      const mapped = csvFields.map((name, idx) => ({
        id: Date.now() + idx,
        name,
        isRequired: true,
        isFixed: false
      }));
      updateFields(mapped);
    }
  }, [csvFields, updateFields]);

  // CSV 필드로 응모 필드 자동설정 (버튼 클릭 시)
  const applyCsvFields = () => {
    if (csvFields.length > 0) {
      const mapped = csvFields.map((name, idx) => ({
        id: Date.now() + idx,
        name,
        isRequired: true,
        isFixed: false
      }));
      updateFields(mapped);
    }
  };
  
  // 아이콘 매핑 (간단화)
  const getIconForField = (fieldName: string) => Settings;

  const toggleFieldRequired = (id: number) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, isRequired: !field.isRequired } : field
    );
    updateFields(updatedFields);
  };

  const FieldCard = ({ 
    field, 
    color, 
    onToggle, 
    onRemove = null,
    showRemove = false 
  }: {
    field: any;
    color: string;
    onToggle: () => void;
    onRemove?: (() => void) | null;
    showRemove?: boolean;
  }) => {
    const IconComponent = getIconForField(field.name);
    
    return (
      <div
        onClick={!field.isFixed ? onToggle : undefined}
        className={`flex items-center justify-between gap-3 p-4 rounded-lg border transition-all duration-200 min-h-[60px]
          ${field.isFixed 
            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 cursor-not-allowed' 
            : field.isRequired
              ? `bg-${color}-50 dark:bg-${color}-900/20 border-${color}-200 dark:border-${color}-700 cursor-pointer hover:shadow-sm`
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer hover:shadow-sm'
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <IconComponent 
              size={18} 
              className={field.isRequired ? `text-${color}-600` : 'text-gray-400 dark:text-gray-500'} 
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={`font-medium text-sm truncate ${field.isRequired ? `text-${color}-700 dark:text-${color}-300` : 'text-gray-700 dark:text-gray-300'}`}>
              {field.name}
            </span>
            {field.isFixed && (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                고정
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap
            ${field.isRequired 
              ? `bg-${color}-100 dark:bg-${color}-800 text-${color}-600 dark:text-${color}-300` 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }
          `}>
            {field.isRequired ? '필수' : '선택'}
          </span>
          
          {showRemove && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout 
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      pageTitle="필드 설정"
    >
      {/* 페이지 헤더 */}
      {eventId && (
        <div className="mb-6 flex flex-col items-center">
          {/* <Button
            variant="outline"
            size="md"
            onClick={applyCsvFields}
            disabled={csvLoading || csvFields.length === 0}
            className="mb-2"
          >
            {csvLoading ? 'CSV 필드 불러오는 중...' : 'CSV 헤더로 필드 자동설정'}
          </Button> */}
          {csvError && <div className="text-red-500 text-sm">{csvError}</div>}
          
        </div>
      )}
      <div className="mb-12 text-center">
        <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          응모 필드를 설정해보세요
        </h1>
        <p className="text-base xl:text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
          경품 응모 참가자들을 식별하기 위해 사용할 필드들을 선택하세요.
        </p>
      </div>

      <GridContainer gap="lg">
        {/* CSV 기반 응모 필드만 표시 */}
        <GridItem>
          <Card isDarkMode={isDarkMode}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Settings size={16} className="text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">응모 필드</h2>
            </div>
            <div className="space-y-3">
              {fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  color="green"
                  onToggle={() => toggleFieldRequired(field.id)}
                />
              ))}
            </div>
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300">
                CSV 파일에서 추출된 필드만 사용합니다.
              </p>
            </div>
          </Card>
        </GridItem>
      </GridContainer>

      {/* 액션 버튼 */}
      <div className="mt-12 flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate('/prize-management')}
        >
          이전으로
        </Button>
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => navigate('/entry-status')}
        >
          다음 단계
        </Button>
      </div>
    </Layout>
  );
};

export default FieldSettings;