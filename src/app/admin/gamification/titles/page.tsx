"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, TextArea } from "@heroui/react";
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
          Titles
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Operaciones admin de titulos. La API no expone listado, por eso editas con Title ID.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Crear titulo</h2>
            </div>
            <Input
              placeholder="slug (ej: season-1-champion)"
              value={createForm.slug}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
            <Input
              placeholder="name"
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="#d4d4d8"
                value={createForm.color}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, color: e.target.value }))}
              />
              <Input
                placeholder="season_id (opcional)"
                value={createForm.season_id}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, season_id: e.target.value }))}
              />
            </div>
            <Button onPress={handleCreate} isPending={createLoading}>
              Crear
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Actualizar titulo</h2>
            </div>
            <Input
              placeholder="title_id"
              value={updateForm.title_id}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, title_id: e.target.value }))}
            />
            <Input
              placeholder="name (opcional)"
              value={updateForm.name}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="color hex (opcional)"
                value={updateForm.color}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, color: e.target.value }))}
              />
              <Input
                placeholder="season_id (opcional)"
                value={updateForm.season_id}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, season_id: e.target.value }))}
              />
            </div>
            <Button onPress={handleUpdate} isPending={updateLoading}>
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Otorgar titulo</h2>
            </div>
            <Input
              placeholder="title_id"
              value={grantForm.title_id}
              onChange={(e) => setGrantForm((prev) => ({ ...prev, title_id: e.target.value }))}
            />
            <Input
              placeholder="user_id"
              value={grantForm.user_id}
              onChange={(e) => setGrantForm((prev) => ({ ...prev, user_id: e.target.value }))}
            />
            <TextArea
              placeholder="reason (opcional)"
              value={grantForm.reason}
              onChange={(e) => setGrantForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
            <Button onPress={handleGrant} isPending={grantLoading}>
              Otorgar
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Revocar titulo</h2>
            </div>
            <Input
              placeholder="title_id"
              value={revokeForm.title_id}
              onChange={(e) => setRevokeForm((prev) => ({ ...prev, title_id: e.target.value }))}
            />
            <Input
              placeholder="user_id"
              value={revokeForm.user_id}
              onChange={(e) => setRevokeForm((prev) => ({ ...prev, user_id: e.target.value }))}
            />
            <TextArea
              placeholder="reason (opcional)"
              value={revokeForm.reason}
              onChange={(e) => setRevokeForm((prev) => ({ ...prev, reason: e.target.value }))}
            />
            <Button onPress={handleRevoke} isPending={revokeLoading}>
              Revocar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
