import { useState } from 'react';

// CCIP 메시지 전송 커스텀 훅
export const useCCIPSender = () => {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const sendCCIPMessage = async (messageData) => {
        setSending(true);
        setError(null);
        
        try {
            // CCIP 메시지 전송 로직
            const response = await fetch('/api/ccip/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
            });
            
            if (!response.ok) {
                throw new Error('CCIP 메시지 전송 실패');
            }
            
            const result = await response.json();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setSending(false);
        }
    };

    return { sendCCIPMessage, sending, error };
};
