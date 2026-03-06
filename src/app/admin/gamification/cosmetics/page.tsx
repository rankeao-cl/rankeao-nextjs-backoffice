"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, TextArea } from "@heroui/react";
import { createCosmetic, grantCosmetic, revokeCosmetic, updateCosmetic } from "@/lib/api-admin";
import { getErrorMessage } from "@/lib/error-message";
import { Gift, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CosmeticsPage() {
  const [createForm, setCreateForm] = useState({
    slug: "",
    name: "",
    type: "AVATAR_FRAME",
    asset_url: "",
    rarity: "common",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [updateForm, setUpdateForm] = useState({
    cosmetic_id: "",
    name: "",
    type: "",
    asset_url: "",
    rarity: "",
    is_active: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const [grantForm, setGrantForm] = useState({
    cosmetic_id: "",
    user_id: "",
    reason: "",
  });
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeForm, setRevokeForm] = useState({
    cosmetic_id: "",
    user_id: "",
    reason: "",
  });
  const [revokeLoading, setRevokeLoading] = useState(false);

  const handleCreate = async () => {
    if (!createForm.slug || !createForm.name || !createForm.type || !createForm.asset_url) {
      toast.error("slug, name, type y asset_url son requeridos");
      return;
    }

    setCreateLoading(true);
    try {
      await createCosmetic({
        slug: createForm.slug,
        name: createForm.name,
        type: createForm.type,
        asset_url: createForm.asset_url,
        rarity: createForm.rarity || undefined,
      });
      toast.success("Cosmetico creado");
      setCreateForm({
        slug: "",
        name: "",
        type: "AVATAR_FRAME",
        asset_url: "",
        rarity: "common",
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!updateForm.cosmetic_id) {
      toast.error("Ingresa el Cosmetic ID");
      return;
    }

    const payload: Record<string, unknown> = {};
    if (updateForm.name) payload.name = updateForm.name;
    if (updateForm.type) payload.type = updateForm.type;
    if (updateForm.asset_url) payload.asset_url = updateForm.asset_url;
    if (updateForm.rarity) payload.rarity = updateForm.rarity;
    if (updateForm.is_active) payload.is_active = updateForm.is_active.toLowerCase() === "true";

    if (Object.keys(payload).length === 0) {
      toast.error("Ingresa al menos un campo para actualizar");
      return;
    }

    setUpdateLoading(true);
    try {
      await updateCosmetic(updateForm.cosmetic_id, payload);
      toast.success("Cosmetico actualizado");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantForm.cosmetic_id || !grantForm.user_id) {
      toast.error("Cosmetic ID y User ID son requeridos");
      return;
    }

    setGrantLoading(true);
    try {
      await grantCosmetic(grantForm.cosmetic_id, {
        user_id: grantForm.user_id,
        reason: grantForm.reason || undefined,
      });
      toast.success("Cosmetico otorgado");
      setGrantForm((prev) => ({ ...prev, user_id: "", reason: "" }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeForm.cosmetic_id || !revokeForm.user_id) {
      toast.error("Cosmetic ID y User ID son requeridos");
      return;
    }

    setRevokeLoading(true);
    try {
      await revokeCosmetic(revokeForm.cosmetic_id, {
        user_id: revokeForm.user_id,
        reason: revokeForm.reason || undefined,
      });
      toast.success("Cosmetico revocado");
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
          Cosmetics
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Operaciones admin de cosmeticos. La API no expone listado, por eso editas con Cosmetic ID.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Crear cosmetico</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="slug"
                value={createForm.slug}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
              <Input
                placeholder="name"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="type: AVATAR_FRAME | NAME_EFFECT | CARD_BACK"
                value={createForm.type}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
              />
              <Input
                placeholder="rarity"
                value={createForm.rarity}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, rarity: e.target.value }))}
              />
            </div>
            <Input
              placeholder="asset_url"
              value={createForm.asset_url}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, asset_url: e.target.value }))}
            />
            <Button onPress={handleCreate} isPending={createLoading}>
              Crear
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f1017] border border-[#2a2f4b]/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-zinc-200" />
              <h2 className="font-semibold text-zinc-200">Actualizar cosmetico</h2>
            </div>
            <Input
              placeholder="cosmetic_id"
              value={updateForm.cosmetic_id}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="name (opcional)"
                value={updateForm.name}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="type (opcional)"
                value={updateForm.type}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="asset_url (opcional)"
                value={updateForm.asset_url}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, asset_url: e.target.value }))}
              />
              <Input
                placeholder="rarity (opcional)"
                value={updateForm.rarity}
                onChange={(e) => setUpdateForm((prev) => ({ ...prev, rarity: e.target.value }))}
              />
            </div>
            <Input
              placeholder="is_active true|false (opcional)"
              value={updateForm.is_active}
              onChange={(e) => setUpdateForm((prev) => ({ ...prev, is_active: e.target.value }))}
            />
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
              <h2 className="font-semibold text-zinc-200">Otorgar cosmetico</h2>
            </div>
            <Input
              placeholder="cosmetic_id"
              value={grantForm.cosmetic_id}
              onChange={(e) => setGrantForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
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
              <h2 className="font-semibold text-zinc-200">Revocar cosmetico</h2>
            </div>
            <Input
              placeholder="cosmetic_id"
              value={revokeForm.cosmetic_id}
              onChange={(e) => setRevokeForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
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
