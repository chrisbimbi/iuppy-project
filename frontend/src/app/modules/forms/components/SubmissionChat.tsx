import React, { useState, useEffect, useRef } from 'react'
import { FormsApi } from '../services/api'
import { Spinner, Alert, Button } from 'react-bootstrap'

type ChatMessage = {
  id: string
  actor: 'user' | 'rh'
  message: string
  createdAt: string
  userId?: string // ID de quem mandou
}

type ChatHistory = {
  chatStatus: 'open' | 'closed'
  messages: ChatMessage[]
}

type Props = {
  formId: string
  submissionId: string
  // ID do usuário do CMS logado (para UI)
  currentCmsUserId: string | null
  companyId?: string
}

// Estilos CSS in-line para simplicidade
const chatStyles: { [key: string]: React.CSSProperties } = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '60vh',
    maxHeight: '60vh',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f9f9f9',
  },
  inputArea: {
    display: 'flex',
    padding: '16px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fff',
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: '18px',
    marginBottom: '10px',
    maxWidth: '75%',
    wordBreak: 'break-word',
  },
  rhBubble: {
    backgroundColor: '#009EF7', // Metronic primary
    color: '#fff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
  },
  userBubble: {
    backgroundColor: '#E1E3EA', // Metronic light
    color: '#3F4254',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
  },
  messageRow: {
    display: 'flex',
    flexDirection: 'column',
  },
  closedBanner: {
    padding: '10px',
    textAlign: 'center',
    backgroundColor: '#f8f8f8',
    color: '#777',
    fontSize: '0.9em',
  }
}

export const SubmissionChat = ({ formId, submissionId, currentCmsUserId, companyId }: Props) => {
  const [history, setHistory] = useState<ChatHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const loadHistory = async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await FormsApi.getChatHistory(formId, submissionId, companyId)
      setHistory(data)
    } catch (e: any) {
      setErr(e.message ?? 'Falha ao carregar histórico de chat')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [formId, submissionId])

  useEffect(() => {
    // Auto-scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history?.messages])

  const handleSend = async () => {
    if (newMessage.trim().length === 0 || sending) return;
    setSending(true);

    try {
      const sentMessage = await FormsApi.postChatMessage(formId, submissionId, newMessage, companyId);
      setHistory(prev => ({
        ...(prev ?? { chatStatus: 'open', messages: [] }),
        messages: [...(prev?.messages ?? []), sentMessage],
        chatStatus: 'open', // Enviar mensagem reabre o chat
      }));
      setNewMessage('');
    } catch (e: any) {
      setErr(e.message ?? 'Falha ao enviar mensagem');
    } finally {
      setSending(false);
    }
  }

  const handleCloseChat = async () => {
    if (closing) return;
    setClosing(true);
    try {
      await FormsApi.closeChat(formId, submissionId, companyId);
      setHistory(prev => ({
        ...(prev ?? { chatStatus: 'open', messages: [] }),
        chatStatus: 'closed',
      }));
    } catch (e: any) {
      setErr(e.message ?? 'Falha ao encerrar chat');
    } finally {
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center gap-2 p-4">
        <Spinner animation="border" size="sm" />
        Carregando histórico...
      </div>
    )
  }

  if (err) {
    return <Alert variant="danger">{err}</Alert>
  }

  const isChatClosed = history?.chatStatus === 'closed';

  return (
    <div style={chatStyles.chatContainer}>
      {/* 1. Área de Mensagens */}
      <div style={chatStyles.messagesArea}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history?.messages.map((msg) => {
            const isMe = msg.actor === 'rh'

            return (
              <div key={msg.id} style={chatStyles.messageRow}>
                <div
                  style={{
                    ...chatStyles.messageBubble,
                    ...(isMe ? chatStyles.rhBubble : chatStyles.userBubble),
                  }}
                >
                  {msg.message}
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 2. Banner de Chat Encerrado */}
      {isChatClosed && (
        <div style={chatStyles.closedBanner}>
          Esta conversa foi encerrada pelo RH.
        </div>
      )}

      {/* 3. Área de Input */}
      <div style={chatStyles.inputArea}>
        <input
          type="text"
          className="form-control"
          placeholder={isChatClosed ? 'Chat encerrado' : 'Digite sua mensagem...'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
          disabled={sending || isChatClosed}
        />
        <Button
          variant="primary"
          className="ms-2"
          onClick={handleSend}
          disabled={sending || isChatClosed}
        >
          {sending ? <Spinner size="sm" /> : 'Enviar'}
        </Button>
      </div>

      {/* 4. Footer com Ação de Encerrar */}
      {!isChatClosed && (
        <div className="p-2 text-end border-top">
          <Button
            variant="light-danger"
            size="sm"
            onClick={handleCloseChat}
            disabled={closing}
          >
            {closing ? 'Encerrando...' : 'Encerrar Conversa'}
          </Button>
        </div>
      )}
    </div>
  )
}