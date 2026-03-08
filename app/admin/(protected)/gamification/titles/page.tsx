"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Fieldset,
  Form,
  Input,
  Label,
  Modal,
  Skeleton,
  Table,
  TextArea,
  TextField,
} from "@heroui/react";
import { toast } from "@heroui/react";
import { useDisclosure } from "@/lib/hooks/use-disclosure";
import { Crown, Edit, Gift, Trash2 } from "lucide-react";
import type { Title, CreateTitleRequest, UpdateTitleRequest, GrantRequest } from "@/lib/types/gamification";
import {
  useTitles,
  useCreateTitle,
  useUpdateTitle,
  useGrantTitle,
  useRevokeTitle,
} from "@/lib/hooks/use-gamification";
import { getErrorMessage } from "@/lib/utils/error-message";

type TitleForm = {
  slug: string;
  name: string;
  color: string;
  season_id: string;
  is_active: boolean;
};

const INITIAL_FORM: TitleForm = {
  slug: "",
  name: "",
  color: "#d4d4d8",
  season_id: "",
  is_active: true,
};

const TABLE_COLUMNS = [
  { key: "name", label: "NOMBRE" },
  { key: "slug", label: "SLUG" },
  { key: "seasonal", label: "ESTACIONAL" },
  { key: "season", label: "TEMPORADA" },
  { key: "holders", label: "PORTADORES" },
  { key: "created_at", label: "CREADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

export default function TitlesPage() {
  const { data: titles = [], isLoading: loading } = useTitles();
  const [search, setSearch] = useState("");

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Title | null>(null);
  const [formData, setFormData] = useState<TitleForm>(INITIAL_FORM);

  const grantModal = useDisclosure();
  const [grantTarget, setGrantTarget] = useState<Title | null>(null);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantReason, setGrantReason] = useState("");

  const revokeModal = useDisclosure();
  const [revokeTarget, setRevokeTarget] = useState<Title | null>(null);
  const [revokeUserId, setRevokeUserId] = useState("");
  const [revokeReason, setRevokeReason] = useState("");

  const createTitle = useCreateTitle();
  const updateTitle = useUpdateTitle();
  const grantTitle = useGrantTitle();
  const revokeTitle = useRevokeTitle();

  const filteredTitles = titles.filter((title) => {
    const q = search.toLowerCase();
    return (
      String(title.name || "").toLowerCase().includes(q) ||
      String(title.slug || "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditTarget(null);
    setFormData(INITIAL_FORM);
    createModal.onOpen();
  };

  const openEdit = (title: Title) => {
    setEditTarget(title);
    setFormData({
      slug: String(title.slug || ""),
      name: String(title.name || ""),
      color: String(title.color || "#d4d4d8"),
      season_id: String(title.season_id || ""),
      is_active: Boolean(title.is_active ?? true),
    });
    createModal.onOpen();
  };

  const handleSave = () => {
    if (editTarget?.id) {
      const data: UpdateTitleRequest = {};
      if (formData.name) data.name = formData.name;
      if (formData.color) data.color = formData.color;
      if (formData.season_id) data.season_id = formData.season_id;
      data.is_active = formData.is_active;

      updateTitle.mutate(
        { id: String(editTarget.id), data },
        {
          onSuccess: () => {
            toast.success("Titulo actualizado");
            createModal.onClose();
          },
          onError: (err) => {
            toast.danger(getErrorMessage(err));
          },
        },
      );
    } else {
      if (!formData.slug || !formData.name) {
        toast.danger("Slug y nombre son requeridos");
        return;
      }

      const data: CreateTitleRequest = {
        slug: formData.slug,
        name: formData.name,
        color: formData.color || undefined,
        season_id: formData.season_id || undefined,
      };

      createTitle.mutate(data, {
        onSuccess: () => {
          toast.success("Titulo creado");
          createModal.onClose();
        },
        onError: (err) => {
          toast.danger(getErrorMessage(err));
        },
      });
    }
  };

  const openGrant = (title: Title) => {
    setGrantTarget(title);
    setGrantUserId("");
    setGrantReason("");
    grantModal.onOpen();
  };

  const handleGrant = () => {
    if (!grantTarget?.id || !grantUserId) {
      toast.danger("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: grantUserId,
      reason: grantReason || undefined,
    };

    grantTitle.mutate(
      { titleId: String(grantTarget.id), data },
      {
        onSuccess: () => {
          toast.success("Titulo otorgado");
          grantModal.onClose();
        },
        onError: (err) => {
          toast.danger(getErrorMessage(err));
        },
      },
    );
  };

  const openRevoke = (title: Title) => {
    setRevokeTarget(title);
    setRevokeUserId("");
    setRevokeReason("");
    revokeModal.onOpen();
  };

  const handleRevoke = () => {
    if (!revokeTarget?.id || !revokeUserId) {
      toast.danger("User ID es requerido");
      return;
    }

    const data: GrantRequest = {
      user_id: revokeUserId,
      reason: revokeReason || undefined,
    };

    revokeTitle.mutate(
      { titleId: String(revokeTarget.id), data },
      {
        onSuccess: () => {
          toast.success("Titulo revocado");
          revokeModal.onClose();
        },
        onError: (err) => {
          toast.danger(getErrorMessage(err));
        },
      },
    );
  };

  const formLoading = createTitle.isPending || updateTitle.isPending;
  const grantLoading = grantTitle.isPending;
  const revokeLoading = revokeTitle.isPending;

  const renderCell = (title: Title, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 shrink-0 rounded-full border border-[var(--border)]"
              style={{ backgroundColor: title.color || "#d4d4d8" }}
            />
            <span className="font-medium text-[var(--foreground)]">
              {String(title.name || "-")}
            </span>
          </div>
        );
      case "slug":
        return (
          <code className="text-xs text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded">
            {String(title.slug || "-")}
          </code>
        );
      case "seasonal":
        return (
          <Chip
            size="sm"
            color="default"
            variant="soft"
          >
            {title.is_seasonal ? "Si" : "No"}
          </Chip>
        );
      case "season":
        return (
          <span className="text-sm text-[var(--foreground)]">
            {title.season?.name || "-"}
          </span>
        );
      case "holders":
        return (
          <span className="text-sm text-[var(--foreground)]">
            {title.total_holders ?? 0}
          </span>
        );
      case "created_at":
        return (
          <span className="text-xs text-[var(--muted)]">
            {title.created_at
              ? new Date(title.created_at).toLocaleDateString("es-CL")
              : "-"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(title)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openGrant(title)}>
              <Gift className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="danger" isIconOnly onPress={() => openRevoke(title)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Titulos
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Crear, editar y otorgar titulos a usuarios</p>
        </div>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[200px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Buscar titulo</Label>
              <Input
                placeholder="Nombre o slug..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearch(e.target.value)}
              />
            </TextField>
            <Button type="button" variant="primary" size="sm" onPress={openCreate}>
              Nuevo titulo
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Titles table">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {filteredTitles.map((title) => (
                      <Table.Row key={String(title.id || title.slug || "-")}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(title, column.key)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      {/* Create / Edit Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={createModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{editTarget ? "Editar Titulo" : "Crear Titulo"}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                        <Input
                          value={formData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Slug</Label>
                        <Input
                          placeholder="season-1-champion"
                          value={formData.slug}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                          disabled={Boolean(editTarget)}
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Color hex</Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 shrink-0 rounded border border-[var(--border)]"
                            style={{ backgroundColor: formData.color || "#d4d4d8" }}
                          />
                          <Input
                            placeholder="#d4d4d8"
                            value={formData.color}
                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                      </TextField>
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Season ID</Label>
                        <Input
                          placeholder="opcional"
                          value={formData.season_id}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, season_id: e.target.value }))}
                        />
                      </TextField>
                    </div>

                    {editTarget && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-[var(--muted)]">Activo</label>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formData.is_active}
                          onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${formData.is_active ? "bg-[var(--primary)]" : "bg-[var(--default)]"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.is_active ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                        <span className="text-xs text-[var(--muted)]">
                          {formData.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    )}
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>
                  Cancelar
                </Button>
                <Button
                  onPress={handleSave}
                  isPending={formLoading}
                  variant="primary"
                >
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Grant Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={grantModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && grantModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Otorgar titulo - {String(grantTarget?.name || "")}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        value={grantUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantUserId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                      <TextArea
                        placeholder="opcional"
                        value={grantReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantReason(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={grantModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="primary" onPress={handleGrant} isPending={grantLoading}>
                  Otorgar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Revoke Modal */}
      <Modal>
        <Modal.Backdrop
          isOpen={revokeModal.isOpen}
          onOpenChange={(isOpen: boolean) => !isOpen && revokeModal.onClose()}
        >
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Revocar titulo - {String(revokeTarget?.name || "")}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        value={revokeUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeUserId(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                      <TextArea
                        placeholder="opcional"
                        value={revokeReason}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeReason(e.target.value)}
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={revokeModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="danger" onPress={handleRevoke} isPending={revokeLoading}>
                  Revocar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
