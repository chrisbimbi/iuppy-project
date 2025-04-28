import React, { useEffect, useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { channelsService } from 'src/app/modules/channels/services/channels.service'
import { Channel } from '@shared/types'

interface Props {
  show: boolean
  onHide: () => void
  channelId?: string
  companyId: string
  onSave: () => void
}

const ChannelModal: React.FC<Props> = ({ show, onHide, channelId, companyId, onSave }) => {
  const [name, setName] = useState('')

  useEffect(() => {
    if (channelId) {
      channelsService.list(companyId).then((channels: Channel[]) => {
        const channel = channels.find(c => c.id === channelId)
        if (channel) setName(channel.name)
      })
    } else {
      setName('')
    }
  }, [channelId, companyId])

  const handleSubmit = async () => {
    if (!name.trim()) return
    if (channelId) {
      await channelsService.update(channelId, { name })
    } else {
      await channelsService.create({ name, companyId })
    }
    onSave()
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{channelId ? `Editar Canal "${name}"` : 'Criar Canal'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group controlId="channelName">
          <Form.Label>Nome do canal</Form.Label>
          <Form.Control
            type="text"
            placeholder="Digite o nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide}>Cancelar</Button>
        <Button variant="primary" onClick={handleSubmit}>
          {channelId ? 'Salvar alterações' : 'Criar canal'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ChannelModal
