// src/app/modules/forms/components/SubmissionDetailModal.tsx
import React, { useState } from 'react'
import { Modal, Button, Spinner, Table, Alert, Tabs, Tab } from 'react-bootstrap'
import { FormsApi } from '../services/api'
import FormAttachmentsModal from './FormAttachmentsModal'
import { SubmissionChat } from './SubmissionChat'
import { useAuth } from 'src/app/modules/auth'

type SubmissionDetail = {
  submissionId: string
  formId: string
  submittedAt: string
  status: string
  external: boolean
  chatStatus: 'open' | 'closed'
  answers: Array<{ 
    fieldId: string; 
    type: string; 
    value: any; 
    label: string;
    options?: any[]
  }>
  attachments: Array<{
    id: string
    storagePath: string
    mimeType: string
    bytes: string
  }>
}

type Props = {
  show: boolean
  onHide: () => void
  form: { id: string; fields: any[]; requiresApproval: boolean } | null
  submissionId: string
  onRespond: (type: 'reply' | 'approve' | 'reject', message: string) => void
}

export const SubmissionDetailModal = ({
  show,
  onHide,
  form,
  submissionId,
  onRespond,
}: Props) => {
  const [data, setData] = useState<SubmissionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [replyMsg, setReplyMsg] = useState('')
  const [activeTab, setActiveTab] = useState('answers')
  
  const { currentUser } = useAuth()
  const cmsUserId = currentUser?.id ?? null

  React.useEffect(() => {
    if (!show || !form) return
    setLoading(true)
    setErr(null)
    setData(null) 
    setActiveTab('answers') 
    
    FormsApi.getSubmissionDetail(form.id, submissionId)
      .then((res: any) => setData(res))
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false))
  }, [show, form, submissionId])

  const formatValue = (value: any, type: string) => {
    if (value === null || value === undefined) return '—'
    if (type === 'multi_choice') {
      const vals = Array.isArray(value) ? value : [String(value)]
      return <ul className="mb-0 ps-4">{vals.map((v, i) => <li key={i}>{v}</li>)}</ul>
    }
    if (type === 'date') {
      try {
        if (String(value).includes('T')) return new Date(value).toLocaleDateString()
        return String(value)
      } catch (e) { return String(value) }
    }
    if (type === 'stars') return `${value} / 5 estrelas`
    if (type === 'scale') return `${value} / 10`
    return String(value)
  }

  const handleLegacyRespond = (type: 'approve' | 'reject') => {
    onRespond(type, replyMsg)
    setReplyMsg('')
  }
  
  const hasAttachments = (data?.attachments ?? []).length > 0;
  
  // 🔥 CORREÇÃO: Permite ação se requer aprovação E status não é final (aceita replied/submitted/pending)
  // Impede aprovar algo que já está approved/rejected
  const canApprove = form?.requiresApproval && 
    (data?.status === 'pending' || data?.status === 'replied' || data?.status === 'submitted');

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Detalhes da Submissão</Modal.Title>
      </Modal.Header>
      
      {loading && <Modal.Body><div className="d-flex align-items-center gap-2 p-4"><Spinner animation="border" size="sm" /> Carregando...</div></Modal.Body>}
      {err && <Modal.Body><Alert variant="danger">{err}</Alert></Modal.Body>}

      {data && (
        <>
          <Modal.Body className="p-0">
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k ?? 'answers')} className="px-4 pt-4">
              <Tab eventKey="answers" title="Respostas">
                <div className="p-4">
                  <Table striped bordered>
                    <tbody>
                      {data.answers.map((ans, index) => (
                        <tr key={ans.fieldId || index}>
                          <td style={{ width: '30%' }}><strong>{ans.label ?? ans.fieldId}</strong></td>
                          <td>{formatValue(ans.value, ans.type)}</td>
                        </tr>
                      ))}
                      {data.answers.length === 0 && <tr><td colSpan={2} className="text-muted text-center p-4">Nenhuma resposta.</td></tr>}
                    </tbody>
                  </Table>
                  {hasAttachments && (
                    <FormAttachmentsModal
                      show={true}
                      onHide={() => {}}
                      date={new Date(data.submittedAt).toLocaleDateString()}
                      items={data.attachments.map((att: any) => ({ url: att.storagePath, name: att.storagePath.split('/').pop() ?? 'anexo' }))}
                    />
                  )}
                </div>
              </Tab>
              <Tab eventKey="chat" title="Discussão (Chat)">
                <div className="p-4">
                   <SubmissionChat formId={form!.id} submissionId={submissionId} currentCmsUserId={cmsUserId} />
                </div>
              </Tab>
            </Tabs>
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Fechar</Button>
            {canApprove && (
              <>
                <textarea
                  className="form-control form-control-sm"
                  rows={1}
                  value={replyMsg}
                  onChange={(e) => setReplyMsg(e.target.value)}
                  placeholder="Mensagem (opcional)..."
                  style={{width: '250px'}}
                />
                <Button variant="success" onClick={() => handleLegacyRespond('approve')}>Aprovar</Button>
                <Button variant="danger" onClick={() => handleLegacyRespond('reject')}>Rejeitar</Button>
              </>
            )}
          </Modal.Footer>
        </>
      )}
    </Modal>
  )
}