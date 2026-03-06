"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
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
        <p className="text-sm text-zinc-500 mt-1">
          Operaciones admin de titulos. La API no expone listado, por eso editas con Title ID.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Crown className="h-5 w-5 text-zinc-200" />
                  Crear titulo
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Crea un titulo nuevo con slug unico y color opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Slug</Label>
                  <Input
                    placeholder="season-1-champion"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Nombre</Label>
                  <Input
                    placeholder="Champion"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-zinc-400">Color</Label>
                    <Input
                      placeholder="#d4d4d8"
                      value={createForm.color}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-zinc-400">Season ID</Label>
                    <Input
                      placeholder="opcional"
                      value={createForm.season_id}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, season_id: e.target.value }))}
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
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Pencil className="h-5 w-5 text-zinc-200" />
                  Actualizar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Modifica campos del titulo existente usando su ID.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={updateForm.title_id}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Nombre</Label>
                  <Input
                    placeholder="opcional"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-zinc-400">Color hex</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.color}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, color: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-zinc-400">Season ID</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.season_id}
                      onChange={(e) => setUpdateForm((prev) => ({ ...prev, season_id: e.target.value }))}
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
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Gift className="h-5 w-5 text-zinc-200" />
                  Otorgar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Asigna un titulo a un usuario con motivo opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={grantForm.title_id}
                    onChange={(e) => setGrantForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">User ID</Label>
                  <Input
                    placeholder="user_id"
                    value={grantForm.user_id}
                    onChange={(e) => setGrantForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Motivo</Label>
                  <TextArea
                    placeholder="opcional"
                    value={grantForm.reason}
                    onChange={(e) => setGrantForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleGrant} isPending={grantLoading}>
                    Otorgar
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>

        <Card className="h-full bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-zinc-200">
                  <Trash2 className="h-5 w-5 text-zinc-200" />
                  Revocar titulo
                </Fieldset.Legend>
                <Description className="text-xs text-zinc-500">
                  Quita un titulo de un usuario y guarda un motivo opcional.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Title ID</Label>
                  <Input
                    placeholder="title_id"
                    value={revokeForm.title_id}
                    onChange={(e) => setRevokeForm((prev) => ({ ...prev, title_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">User ID</Label>
                  <Input
                    placeholder="user_id"
                    value={revokeForm.user_id}
                    onChange={(e) => setRevokeForm((prev) => ({ ...prev, user_id: e.target.value }))}
                  />
                </TextField>
                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-zinc-400">Motivo</Label>
                  <TextArea
                    placeholder="opcional"
                    value={revokeForm.reason}
                    onChange={(e) => setRevokeForm((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleRevoke} isPending={revokeLoading}>
                    Revocar
                  </Button>
                </Fieldset.Actions>
              </Fieldset>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
