// src/app/modules/forms/components/FormsEmailSettingsModal.tsx
import React from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { FormsApi } from '../services/api';

type Props = {
  show: boolean;
  onHide: () => void;
  formId: string;
};

type Space = { id: string; name: string };
type Setting = { spaceId: string | null; emails: string[] };

export default function FormEmailSettingsModal({ show, onHide, formId }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [allSpaces, setAllSpaces] = React.useState<Space[]>([]);
  const [audienceSpaces, setAudienceSpaces] = React.useState<string[]>([]);
  const [items, setItems] = React.useState<Record<string, string>>({});
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!show) return;
    setLoading(true);
    setErr(null);

    Promise.all([
      FormsApi.get(formId),
      FormsApi.segmentationOptions(), // { spaces, groups }
      FormsApi.getFormNotificationSettings(formId),
    ])
      .then(([form, segs, settings]) => {
        const spaces: Space[] = Array.isArray(segs?.spaces) ? segs.spaces : [];
        setAllSpaces(spaces);

        const formAudience: string[] = Array.isArray(form?.audienceSpaceIds)
          ? form.audienceSpaceIds
          : [];
        setAudienceSpaces(formAudience);

        const map: Record<string, string> = {};
        (settings?.items ?? []).forEach((s: Setting) => {
          const key = s.spaceId ?? '__global__';
          map[key] = Array.isArray(s.emails) ? s.emails.join(', ') : String(s.emails ?? '');
        });

        setItems(map);
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, [show, formId]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const spacesToPersist =
        audienceSpaces.length > 0
          ? allSpaces.filter((s) => audienceSpaces.includes(s.id))
          : [];

      // monta tudo que o usuário digitou
      const rawList = [
        {
          spaceId: null,
          emails: (items['__global__'] ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        ...spacesToPersist.map((s) => ({
          spaceId: s.id,
          emails: (items[s.id] ?? '')
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
        })),
      ];

      // O backend S1 (corrigido) agora aceita o array completo
      await FormsApi.saveFormNotificationSettings(formId, rawList);

      onHide();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);

    }
  };

  const visibleSpaces: Space[] =
    audienceSpaces.length > 0
      ? allSpaces.filter((s) => audienceSpaces.includes(s.id))
      : [];

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Notificações por space</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="d-flex gap-2 align-items-center">
            <Spinner animation="border" size="sm" /> <span>Carregando…</span>
          </div>
        )}
        {err && <div className="alert alert-danger">{err}</div>}

        Não {!loading && (
          <>
            {/* global */}
            <Form.Group className="mb-4">
              <Form.Label>Global (todos os envios deste formulário)</Form.Label>
              <Form.Control
                type="text"
                placeholder="email@empresa.com, outro@empresa.com"
                value={items['__global__'] ?? ''}
                onChange={(e) =>
                  setItems((prev) => ({
                    ...prev,
                    __global__: e.target.value,
                  }))
                }
              />
              <Form.Text className="text-muted">
                Esses e-mails recebem sempre que alguém enviar esse formulário.
              </Form.Text>
            </Form.Group>

            {audienceSpaces.length === 0 && (
              <div className="alert alert-info">
                Este formulário está para a empresa inteira ou sem segmentação. Se quiser e-mails
                section por space, primeiro selecione os spaces na aba de segmentação.
              </div>
            )}

            {visibleSpaces.map((s) => (
              <Form.Group key={s.id} className="mb-3">
                <Form.Label>{s.name}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="email@empresa.com, outro@empresa.com"
                  value={items[s.id] ?? ''}
                  onChange={(e) =>
                    setItems((prev) => ({
                      ...prev,
                      [s.id]: e.target.value,
                    }))
                  }
                />
                <Form.Text className="text-muted">
                   Um ou mais e-mails para quem deve ser avisado quando alguém desse space enviar.
                </Form.Text>
              </Form.Group>
            ))}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Fechar
        </Button>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}