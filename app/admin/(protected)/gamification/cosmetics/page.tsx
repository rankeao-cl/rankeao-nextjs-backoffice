"use client";

import {
  useState
} from "react";
import {
  Button,
  Description,
  Fieldset,
  Form,
  Input,
  Label,
  TextArea,
  TextField,
  Card,
} from "@heroui/react";
import { toast } from "@heroui/react";
import { Gift, Pencil, Sparkles, Trash2 } from "lucide-react";
import {
  useCreateCosmetic,
  useUpdateCosmetic,
  useGrantCosmetic,
  useRevokeCosmetic,
} from "@/lib/hooks/use-gamification";
import type {
  CreateCosmeticRequest,
  UpdateCosmeticRequest,
  GrantRequest,
} from "@/lib/types/gamification";

export default function CosmeticsPage() {
  const [createForm, setCreateForm] = useState({
    slug: "",
    name: "",
    type: "AVATAR_FRAME",
    asset_url: "",
    rarity: "common",
  });

  const [updateForm, setUpdateForm] = useState({
    cosmetic_id: "",
    name: "",
    type: "",
    asset_url: "",
    rarity: "",
    is_active: "",
  });

  const [grantForm, setGrantForm] = useState({
    cosmetic_id: "",
    user_id: "",
    reason: "",
  });

  const [revokeForm, setRevokeForm] = useState({
    cosmetic_id: "",
    user_id: "",
    reason: "",
  });

  const createCosmetic = useCreateCosmetic();
  const updateCosmetic = useUpdateCosmetic();
  const grantCosmetic = useGrantCosmetic();
  const revokeCosmetic = useRevokeCosmetic();

  const handleCreate = () => {
    if (!createForm.slug || !createForm.name || !createForm.type || !createForm.asset_url) {
      toast.danger("slug, name, type y asset_url son requeridos");
      return;
    }

    const data: CreateCosmeticRequest = {
      slug: createForm.slug,
      name: createForm.name,
      type: createForm.type,
      asset_url: createForm.asset_url,
      rarity: createForm.rarity || undefined,
    };

    createCosmetic.mutate(data, {
      onSuccess: () => {
        toast.success("Cosmetico creado");
        setCreateForm({
          slug: "",
          name: "",
          type: "AVATAR_FRAME",
          asset_url: "",
          rarity: "common",
        });
      },
      onError: (err) => {
        toast.danger(err instanceof Error ? err.message : "Error al crear cosmetico");
      },
    });
  };

  const handleUpdate = () => {
    if (!updateForm.cosmetic_id) {
      toast.danger("Ingresa el Cosmetic ID");
      return;
    }

    const data: UpdateCosmeticRequest = {};
    if (updateForm.name) data.name = updateForm.name;
    if (updateForm.type) data.type = updateForm.type;
    if (updateForm.asset_url) data.asset_url = updateForm.asset_url;
    if (updateForm.rarity) data.rarity = updateForm.rarity;
    if (updateForm.is_active) data.is_active = updateForm.is_active.toLowerCase() === "true";

    if (Object.keys(data).length === 0) {
      toast.danger("Ingresa al menos un campo para actualizar");
      return;
    }

    updateCosmetic.mutate({ id: updateForm.cosmetic_id, data }, {
      onSuccess: () => {
        toast.success("Cosmetico actualizado");
      },
      onError: (err) => {
        toast.danger(err instanceof Error ? err.message : "Error al actualizar cosmetico");
      },
    });
  };

  const handleGrant = () => {
    if (!grantForm.cosmetic_id || !grantForm.user_id) {
      toast.danger("Cosmetic ID y User ID son requeridos");
      return;
    }

    const data: GrantRequest = {
      user_id: grantForm.user_id,
      reason: grantForm.reason || undefined,
    };

    grantCosmetic.mutate({ cosmeticId: grantForm.cosmetic_id, data }, {
      onSuccess: () => {
        toast.success("Cosmetico otorgado");
        setGrantForm((prev) => ({ ...prev, user_id: "", reason: "" }));
      },
      onError: (err) => {
        toast.danger(err instanceof Error ? err.message : "Error al otorgar cosmetico");
      },
    });
  };

  const handleRevoke = () => {
    if (!revokeForm.cosmetic_id || !revokeForm.user_id) {
      toast.danger("Cosmetic ID y User ID son requeridos");
      return;
    }

    const data: GrantRequest = {
      user_id: revokeForm.user_id,
      reason: revokeForm.reason || undefined,
    };

    revokeCosmetic.mutate({ cosmeticId: revokeForm.cosmetic_id, data }, {
      onSuccess: () => {
        toast.success("Cosmetico revocado");
        setRevokeForm((prev) => ({ ...prev, user_id: "", reason: "" }));
      },
      onError: (err) => {
        toast.danger(err instanceof Error ? err.message : "Error al revocar cosmetico");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-heading)] text-gradient-purple-cyan">
          Cosmeticos
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Operaciones admin de cosmeticos. La API no expone listado, por eso editas con Cosmetic ID.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--surface)] border border-[var(--border)]">
          <Card.Content className="p-5">
            <Form className="space-y-4">
              <Fieldset className="space-y-4">
                <Fieldset.Legend className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                  <Sparkles className="h-5 w-5 text-[var(--foreground)]" />
                  Crear cosmetico
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Registra un cosmetico nuevo con tipo, rareza y recurso visual.
                </Description>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Slug</Label>
                    <Input
                      placeholder="slug"
                      value={createForm.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                    <Input
                      placeholder="name"
                      value={createForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </TextField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Tipo</Label>
                    <Input
                      placeholder="AVATAR_FRAME | NAME_EFFECT | CARD_BACK"
                      value={createForm.type}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Rareza</Label>
                    <Input
                      placeholder="rarity"
                      value={createForm.rarity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, rarity: e.target.value }))}
                    />
                  </TextField>
                </div>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Asset URL</Label>
                  <Input
                    placeholder="asset_url"
                    value={createForm.asset_url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCreateForm((prev) => ({ ...prev, asset_url: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleCreate} isPending={createCosmetic.isPending}>
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
                  Actualizar cosmetico
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Ajusta cualquier atributo de un cosmetico existente.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Cosmetic ID</Label>
                  <Input
                    placeholder="cosmetic_id"
                    value={updateForm.cosmetic_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
                  />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Nombre</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Tipo</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.type}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </TextField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Asset URL</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.asset_url}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, asset_url: e.target.value }))}
                    />
                  </TextField>
                  <TextField className="space-y-1 flex flex-col">
                    <Label className="text-xs text-[var(--muted)]">Rareza</Label>
                    <Input
                      placeholder="opcional"
                      value={updateForm.rarity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, rarity: e.target.value }))}
                    />
                  </TextField>
                </div>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">is_active</Label>
                  <Input
                    placeholder="true | false (opcional)"
                    value={updateForm.is_active}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUpdateForm((prev) => ({ ...prev, is_active: e.target.value }))}
                  />
                </TextField>

                <Fieldset.Actions className="pt-1">
                  <Button type="button" onPress={handleUpdate} isPending={updateCosmetic.isPending}>
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
                  Otorgar cosmetico
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Entrega un cosmetico a un usuario puntual.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Cosmetic ID</Label>
                  <Input
                    placeholder="cosmetic_id"
                    value={grantForm.cosmetic_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setGrantForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
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
                  <Button type="button" onPress={handleGrant} isPending={grantCosmetic.isPending}>
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
                  Revocar cosmetico
                </Fieldset.Legend>
                <Description className="text-xs text-[var(--muted)]">
                  Retira un cosmetico previamente asignado.
                </Description>

                <TextField className="space-y-1 flex flex-col">
                  <Label className="text-xs text-[var(--muted)]">Cosmetic ID</Label>
                  <Input
                    placeholder="cosmetic_id"
                    value={revokeForm.cosmetic_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRevokeForm((prev) => ({ ...prev, cosmetic_id: e.target.value }))}
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
                  <Button type="button" onPress={handleRevoke} isPending={revokeCosmetic.isPending}>
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
