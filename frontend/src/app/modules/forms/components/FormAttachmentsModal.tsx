// src/app/modules/forms/components/FormAttachmentsModal.tsx
// (Nenhuma alteração necessária, este arquivo está correto)

import React from 'react'
import { Modal, Button } from 'react-bootstrap'

type Props = {
  show: boolean
  onHide: () => void
  date?: string
  items?: Array<{ url: string; name?: string }>
}

export default function FormAttachmentsModal({ show, onHide, date, items = [] }: Props) {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Anexos {date ? `(${date})` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {items.length === 0 && <div>Nenhum anexo encontrado.</div>}
        {items.map((it, idx) => (
          <div key={idx} className="mb-2">
            <a href={it.url} target="_blank" rel="noreferrer">
              {it.name ?? it.url}
            </a>
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  )
}