"use client";

import {
  useState
} from "react";
import {
  Card,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
  Button,
} from "@heroui/react";
import { createTitle, grantTitle, revokeTitle, updateTitle } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { Crown, Gift, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function TitlesPage() {
  const [createForm, setCreateForm] = useState({
    slug: "",
    name: "",
    color: "#d4d4d8",
    season_id: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    title_id: "",
    name: "",
    color: "",
    season_id: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const [grantForm, setGrantForm] = useState({
    title_id: "",
    user_id: "",
    reason: "",
  });
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeForm, setRevokeForm] = useState({
    title_id: "",
    user_id: "",
    reason: "",
  });
  const [revokeLoading, setRevokeLoading] = useState(false);

  const handleCreate = async () => {
    if (!createForm.slug || !createForm.name) {
      toast.error("Slug y nombre son requeridos");
      return;
    }

    setCreateLoading(true);
    try {
      await createTitle({
        slug: createForm.slug,
        name: createForm.name,
        color: createForm.color || undefined,
        season_id: createForm.season_id || undefined,
      });
      toast.success("Titulo creado");
      setCreateForm({ slug: "", name: "", color: "#d4d4d8", season_id: "" });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateForm.title_id) {
      toast.error("Ingresa el Title ID");
      return;
    }

    const payload: Record<string, unknown> = {};
    if (updateForm.name) payload.name = updateForm.name;
    if (updateForm.color) payload.color = updateForm.color;
    if (updateForm.season_id) payload.season_id = updateForm.season_id;

    if (Object.keys(payload).length === 0) {
      toast.error("Ingresa al menos un campo para actualizar");
      return;
    }

    setUpdateLoading(true);
    try {
      await updateTitle(updateForm.title_id, payload);
      toast.success("Titulo actualizado");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantForm.title_id || !grantForm.user_id) {
      toast.error("Title ID y User ID son requeridos");
      return;
    }

    setGrantLoading(true);
    try {
      await grantTitle(grantForm.title_id, {
        user_id: grantForm.user_id,
        reason: grantForm.reason || undefined,
      });
      toast.success("Titulo otorgado");
      setGrantForm((prev) => ({ ...prev, user_id: "", reason: "" }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeForm.title_id || !revokeForm.user_id) {
      toast.error("Title ID y User ID son requeridos");
      return;
    }

    setRevokeLoading(true);
    try {
      await revokeTitle(revokeForm.title_id, {
        user_id: revokeForm.user_id,
        reason: revokeForm.reason || undefined,
      });
      toast.success("Titulo revocado");
      setRevokeForm((prev) => ({ ...prev, user_id: "", reason: "" }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Titulos
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Operaciones admin de titulos. La API no expone listado, por eso editas con Title ID.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Crown className="h-5 w-5 text-[var(--foreground)]" />
                  Crear titulo
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Crea un titulo nuevo con slug unico y color opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Slug</Label>
                  <Input
                    placeholder="season-1-champion"
                    value={createForm.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                  <Input
                    placeholder="Champion"
                    value={createForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Color</Label>
                    <Input
                      placeholder="#d4d4d8"
                      value={createForm.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Season ID</Label>
                    <Input
                      placeholder="opcional"
                      value={createForm.season_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, season_id: e.target.value }))}
                    />
                  </TextField>
                </div>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleCreate} isPending={createLoading}>
                    Crear
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Pencil className="h-5 w-5 text-[var(--foreground)]" />
                  Actualizar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Modifica campos del titulo existente usando su ID.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={updateForm.title_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                  <Input
                    placeholder="opcional"
                    value={updateForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Color hex</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Season ID</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.season_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, season_id: e.target.value }))}
                    />
                  </TextField>
                </div>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleUpdate} isPending={updateLoading}>
                    Guardar cambios
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Gift className="h-5 w-5 text-[var(--foreground)]" />
                  Otorgar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Asigna un titulo a un usuario con motivo opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={grantForm.title_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">User ID</Label>
                  <Input
                    placeholder="user_id"
                    value={grantForm.user_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                  <TextArea
                    placeholder="opcional"
                    value={grantForm.reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleGrant} isPending={grantLoading}>
                    Otorgar
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>

        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Trash2 className="h-5 w-5 text-[var(--foreground)]" />
                  Revocar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Quita un titulo de un usuario y guarda un motivo opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={revokeForm.title_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">User ID</Label>
                  <Input
                    placeholder="user_id"
                    value={revokeForm.user_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Motivo</Label>
                  <TextArea
                    placeholder="opcional"
                    value={revokeForm.reason}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleRevoke} isPending={revokeLoading}>
                    Revocar
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

