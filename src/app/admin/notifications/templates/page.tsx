"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";
import {
  Button,
  Chip,
  ComboBox,
  Fieldset,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Skeleton,
  Spinner,
  Table,
  TextArea,
  TextField,
  Card,
} from "@heroui/react";
import {
  createTemplate,
  getTemplates,
  previewTemplate,
  testTemplate,
  updateTemplate,
  type ListMeta,
} from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Bell, Edit, Eye, Send } from "lucide-react";
import { toast } from "sonner";

type Template = Record<string, unknown>;

type ActiveFilter = "all" | "true" | "false";

const TABLE_COLUMNS = [
  { key: "key", label: "KEY" },
  { key: "category", label: "CATEGORIA" },
  { key: "priority", label: "PRIORIDAD" },
  { key: "channels", label: "CANALES" },
  { key: "status", label: "ESTADO" },
  { key: "actions", label: "ACCIONES" },
] as const;

const EMPTY_META: ListMeta = {
  page: 1,
  per_page: 20,
  total: 0,
  total_pages: 1,
};

const CATEGORY_OPTIONS = ["system", "social", "marketplace", "gamification", "security"];
const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "CRITICAL"];

function parseJsonObject(text: string, fieldName: string): Record<string, string> {
  if (!text.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${fieldName} debe ser JSON valido`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${fieldName} debe ser un objeto JSON`);
  }

  const output: Record<string, string> = {};
  Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
    output[key] = String(value ?? "");
  });

  return output;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [meta, setMeta] = useState<ListMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);
  const [perPageInput, setPerPageInput] = useState("20");

  const createModal = useDisclosure();
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    category: "system",
    title_template: "",
    body_template: "",
    channels: "IN_APP",
    priority: "NORMAL",
    is_active: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  const previewModal = useDisclosure();
  const [previewTarget, setPreviewTarget] = useState<Template | null>(null);
  const [previewVariablesText, setPreviewVariablesText] = useState("{}");
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const testModal = useDisclosure();
  const [testTarget, setTestTarget] = useState<Template | null>(null);
  const [testUserId, setTestUserId] = useState("");
  const [testChannels, setTestChannels] = useState("IN_APP");
  const [testVariablesText, setTestVariablesText] = useState("{}");
  const [testLoading, setTestLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const perPage = Math.max(1, Number.parseInt(perPageInput, 10) || 20);
      const res = await getTemplates({
        q: query || undefined,
        category: category || undefined,
        is_active: isActive === "all" ? undefined : isActive === "true",
        page,
        per_page: perPage,
      });

      setTemplates((res.templates as Template[]) || []);
      setMeta(res.meta || EMPTY_META);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Error al cargar templates"));
    } finally {
      setLoading(false);
    }
  }, [category, isActive, page, perPageInput, query]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const applyFilters = () => {
    if (page !== 1) {
      setPage(1);
      return;
    }
    fetchTemplates();
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setIsActive("all");
    setPerPageInput("20");
    setPage(1);
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormData({
      key: "",
      category: "system",
      title_template: "",
      body_template: "",
      channels: "IN_APP",
      priority: "NORMAL",
      is_active: true,
    });
    createModal.onOpen();
  };

  const openEdit = (template: Template) => {
    setEditTarget(template);
    setFormData({
      key: String(template.key || ""),
      category: String(template.category || "system"),
      title_template: String(template.title_template || ""),
      body_template: String(template.body_template || ""),
      channels: Array.isArray(template.channels)
        ? (template.channels as string[]).join(",")
        : "IN_APP",
      priority: String(template.priority || "NORMAL"),
      is_active: Boolean(template.is_active ?? true),
    });
    createModal.onOpen();
  };

  const handleSave = async () => {
    setFormLoading(true);
    try {
      const channelList = formData.channels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (editTarget?.id) {
        await updateTemplate(Number(editTarget.id), {
          category: formData.category,
          title_template: formData.title_template,
          body_template: formData.body_template,
          channels: channelList,
          priority: formData.priority,
          is_active: formData.is_active,
        });
        toast.success("Template actualizado");
      } else {
        await createTemplate({
          key: formData.key,
          category: formData.category,
          title_template: formData.title_template,
          body_template: formData.body_template,
          channels: channelList,
          priority: formData.priority,
        });
        toast.success("Template creado");
      }

      createModal.onClose();
      fetchTemplates();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setFormLoading(false);
    }
  };

  const openPreview = (template: Template) => {
    setPreviewTarget(template);
    setPreviewVariablesText("{}");
    setPreviewData(null);
    previewModal.onOpen();
  };

  const handlePreview = async () => {
    if (!previewTarget?.id) {
      return;
    }

    setPreviewLoading(true);
    try {
      const variables = parseJsonObject(previewVariablesText, "variables");
      const result = await previewTemplate(
        Number(previewTarget.id),
        Object.keys(variables).length ? variables : undefined
      );
      setPreviewData(result as Record<string, unknown>);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setPreviewLoading(false);
    }
  };

  const openTest = (template: Template) => {
    setTestTarget(template);
    setTestUserId("");
    setTestChannels(
      Array.isArray(template.channels) ? (template.channels as string[]).join(",") : "IN_APP"
    );
    setTestVariablesText("{}");
    testModal.onOpen();
  };

  const handleTest = async () => {
    if (!testTarget?.id || !testUserId) return;

    setTestLoading(true);
    try {
      const variables = parseJsonObject(testVariablesText, "variables");
      const channels = testChannels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      await testTemplate(Number(testTarget.id), {
        user_id: Number.parseInt(testUserId, 10),
        channels: channels.length ? channels : undefined,
        variables: Object.keys(variables).length ? variables : undefined,
      });
      toast.success("Test notification sent");
      testModal.onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setTestLoading(false);
    }
  };

  const renderCell = (template: Template, columnKey: string) => {
    switch (columnKey) {
      case "key":
        return (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--foreground)]" />
            <code className="text-xs">{String(template.key || "-")}</code>
          </div>
        );
      case "category":
        return <Chip size="sm" variant="soft">{String(template.category || "-")}</Chip>;
      case "priority":
        return (
          <Chip size="sm" color="default" variant="soft">
            {String(template.priority || "-")}
          </Chip>
        );
      case "channels":
        return (
          <span className="text-xs">
            {Array.isArray(template.channels)
              ? (template.channels as string[]).join(", ")
              : "-"}
          </span>
        );
      case "status":
        return (
          <Chip size="sm" color="default" variant="soft">
            {template.is_active ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openEdit(template)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openPreview(template)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="secondary" isIconOnly onPress={() => openTest(template)}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const canPrev = page > 1;
  const canNext = page < Math.max(1, meta.total_pages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
            Plantillas de Notificacion
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">CRUD completo con preview y test usando variables</p>
        </div>
        <Button
          type="button"
          onPress={openCreate}

        >
          Nueva plantilla
        </Button>
      </div>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="px-5 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <TextField className="space-y-1 flex flex-col min-w-[160px] flex-1">
              <Label className="text-xs text-[var(--muted)]">Busqueda</Label>
              <Input placeholder="texto libre" value={query} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuery(e.target.value)} />
            </TextField>

            <ComboBox
              className="min-w-[160px] flex-1"
              inputValue={category}
              onInputChange={setCategory}
              onSelectionChange={(key: string | number | null) => setCategory(String(key || ""))}
            >
              <Label>Categoria</Label>
              <ComboBox.InputGroup>
                <Input placeholder="system, social..." />
                <ComboBox.Trigger />
              </ComboBox.InputGroup>
              <ComboBox.Popover>
                <ListBox>
                  {CATEGORY_OPTIONS.map((option) => (
                    <ListBox.Item key={option} id={option} textValue={option}>
                      {option}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </ComboBox.Popover>
            </ComboBox>

            <TextField className="space-y-1 flex flex-col w-24">
              <Label className="text-xs text-[var(--muted)]">Per page</Label>
              <Input
                type="number"
                min={1}
                value={perPageInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPerPageInput(e.target.value)}
              />
            </TextField>

            <Select
              className="min-w-[120px]"
              selectedKey={isActive}
              onSelectionChange={(key: string | number | null) => setIsActive(String(key || "all") as ActiveFilter)}
            >
              <Label>Estado</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="Todos">
                    Todos
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="true" textValue="Activos">
                    Activos
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="false" textValue="Inactivos">
                    Inactivos
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <Button type="button" size="sm" variant="primary" onPress={applyFilters}>Aplicar filtros</Button>
            <Button type="button" size="sm" variant="tertiary" onPress={clearFilters}>Limpiar</Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="bg-[var(--surface)] border border-[var(--border)]">
        <Card.Content className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
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
                <Table.Content aria-label="Templates">
                  <Table.Header columns={TABLE_COLUMNS}>
                    {(column: { key: string; label: string }) => (
                      <Table.Column key={column.key} isRowHeader={column.key === TABLE_COLUMNS[0].key}>
                        {column.label}
                      </Table.Column>
                    )}
                  </Table.Header>
                  <Table.Body>
                    {templates.map((template) => (
                      <Table.Row key={String(template.id || template.key || "-")}>
                        {TABLE_COLUMNS.map((column: { key: string; label: string }) => (
                          <Table.Cell key={column.key}>
                            {renderCell(template, column.key)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)] px-5 py-3 border-t border-[var(--border)]">
            <span>
              Pagina {meta.page} de {meta.total_pages} | Total aproximado: {meta.total}
            </span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" isDisabled={!canPrev} onPress={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button type="button" size="sm" variant="secondary" isDisabled={!canNext} onPress={() => setPage((prev) => prev + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={createModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && createModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{editTarget ? "Editar plantilla" : "Crear plantilla"}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Key</Label>
                        <Input
                          value={formData.key}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                          disabled={Boolean(editTarget)}
                        />
                      </TextField>
                      <ComboBox
                        className="w-full"
                        inputValue={formData.category}
                        onInputChange={(value: string) => setFormData((prev) => ({ ...prev, category: value }))}
                        onSelectionChange={(key: string | number | null) =>
                          setFormData((prev) => ({ ...prev, category: String(key || prev.category) }))
                        }
                      >
                        <Label>Categoria</Label>
                        <ComboBox.InputGroup>
                          <Input placeholder="category" />
                          <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                          <ListBox>
                            {CATEGORY_OPTIONS.map((option) => (
                              <ListBox.Item key={option} id={option} textValue={option}>
                                {option}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </ComboBox.Popover>
                      </ComboBox>
                    </div>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Titulo plantilla</Label>
                      <Input
                        value={formData.title_template}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, title_template: e.target.value }))}
                      />
                    </TextField>

                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Cuerpo plantilla</Label>
                      <TextArea
                        value={formData.body_template}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, body_template: e.target.value }))}
                        rows={3}
                      />
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextField className="space-y-1 flex flex-col">
                        <Label className="text-xs text-[var(--muted)]">Canales</Label>
                        <Input
                          placeholder="IN_APP,EMAIL..."
                          value={formData.channels}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, channels: e.target.value }))}
                        />
                      </TextField>
                      <Select
                        className="w-full"
                        selectedKey={formData.priority}
                        onSelectionChange={(key: string | number | null) =>
                          setFormData((prev) => ({ ...prev, priority: String(key || "NORMAL") }))
                        }
                      >
                        <Label>Prioridad</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {PRIORITY_OPTIONS.map((option) => (
                              <ListBox.Item key={option} id={option} textValue={option}>
                                {option}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>

                    <Fieldset.Actions className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={formData.is_active ? "primary" : "secondary"}
                        onPress={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                      >
                        is_active: {formData.is_active ? "true" : "false"}
                      </Button>
                      <p className="text-xs text-[var(--muted)]">Se envía en update.</p>
                    </Fieldset.Actions>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={createModal.onClose}>Cancelar</Button>
                <Button variant="primary" onPress={handleSave} isPending={formLoading}>
                  {editTarget ? "Guardar" : "Crear"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={previewModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && previewModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Previsualizar plantilla - {String(previewTarget?.key || "")}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Variables (JSON)</Label>
                      <TextArea
                        placeholder='{"username":"demo"}'
                        value={previewVariablesText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setPreviewVariablesText(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </TextField>
                    <Fieldset.Actions>
                      <Button type="button" size="sm" variant="secondary" onPress={handlePreview} isPending={previewLoading}>
                        Renderizar preview
                      </Button>
                    </Fieldset.Actions>
                  </Fieldset>
                </Form>

                {previewData ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[var(--muted)]">Titulo</label>
                      <p className="text-[var(--foreground)] font-medium">
                        {String((previewData.data as Record<string, unknown>)?.title || previewData.title || "")}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--muted)]">Cuerpo</label>
                      <p className="text-[var(--foreground)] text-sm whitespace-pre-wrap">
                        {String((previewData.data as Record<string, unknown>)?.body || previewData.body || "")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={previewModal.onClose}>Cerrar</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop isOpen={testModal.isOpen} onOpenChange={(isOpen: boolean) => !isOpen && testModal.onClose()}>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Enviar prueba - {String(testTarget?.key || "")}</Modal.Heading></Modal.Header>
              <Modal.Body className="gap-4">
                <Form className="w-full">
                  <Fieldset className="space-y-4 w-full">
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">User ID</Label>
                      <Input
                        value={testUserId}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTestUserId(e.target.value)}
                        type="number"
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Canales</Label>
                      <Input
                        placeholder="IN_APP,EMAIL,PUSH,SMS"
                        value={testChannels}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTestChannels(e.target.value)}
                      />
                    </TextField>
                    <TextField className="space-y-1 flex flex-col">
                      <Label className="text-xs text-[var(--muted)]">Variables (JSON)</Label>
                      <TextArea
                        placeholder='{"username":"demo"}'
                        value={testVariablesText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTestVariablesText(e.target.value)}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </TextField>
                  </Fieldset>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={testModal.onClose}>Cancelar</Button>
                <Button variant="primary" onPress={handleTest} isPending={testLoading}>Enviar prueba</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div >
  );
}


