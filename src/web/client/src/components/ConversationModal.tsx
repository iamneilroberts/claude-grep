import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';
import type { SearchResult, ParsedMessage } from '../types.js';
import './ConversationModal.css';

interface ConversationModalProps {
  sessionId: string;
  onClose: () => void;
}

export function ConversationModal({ sessionId, onClose }: ConversationModalProps) {
  const api = useApi();
  const [conversation, setConversation] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversation();
  }, [sessionId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getConversation(sessionId);
      setConversation(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderMessage = (message: ParsedMessage, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id || index} className={`message ${isUser ? 'user' : 'assistant'}`}>
        <div className="message-header">
          <span className="message-role">{isUser ? 'User' : 'Claude'}</span>
          <span className="message-time">{formatDate(message.timestamp)}</span>
        </div>
        <div className="message-content">
          <pre>{message.content}</pre>
        </div>
        {message.files && message.files.length > 0 && (
          <div className="message-files">
            <span className="files-label">Files:</span>
            {message.files.map((file, index) => (
              <span key={index} className="file-tag">{file}</span>
            ))}
          </div>
        )}
        <div className="message-badges">
          {message.hasError && <span className="badge error">Error</span>}
          {message.hasToolCall && <span className="badge tool">Tool Call</span>}
        </div>
      </div>
    );
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Conversation Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading && <div className="modal-loading">Loading conversation...</div>}
          
          {error && (
            <div className="modal-error">
              Error loading conversation: {error}
            </div>
          )}
          
          {conversation && (
            <>
              <div className="conversation-meta">
                <div className="meta-item">
                  <span className="meta-label">Session ID:</span>
                  <span className="meta-value">{conversation.sessionId}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Project:</span>
                  <span className="meta-value">{conversation.projectName}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Started:</span>
                  <span className="meta-value">{formatDate(conversation.timestamp)}</span>
                </div>
                {conversation.lastMessageTime && (
                  <div className="meta-item">
                    <span className="meta-label">Last Message:</span>
                    <span className="meta-value">{formatDate(conversation.lastMessageTime)}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Total Messages:</span>
                  <span className="meta-value">{conversation.totalMessages || conversation.metadata?.totalMessages || conversation.matchCount || 0}</span>
                </div>
              </div>
              
              <div className="conversation-messages">
                {conversation.matchedMessages?.map(renderMessage) || 
                 <div>No messages available</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}