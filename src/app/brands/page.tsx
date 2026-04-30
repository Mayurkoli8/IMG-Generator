"use client";
// src/app/brands/page.tsx
import { AppLayout } from "@/components/AppLayout";
import {
  Card, Button, Input, Textarea, ColorInput, Modal, Badge, EmptyState
} from "@/components/ui";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2, Plus, Edit, Trash2, Globe, Phone, Instagram } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  instagramHandle: string | null;
  facebookHandle: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  _count?: { assets: number; generations: number };
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  tagline: "",
  website: "",
  phone: "",
  email: "",
  address: "",
  instagramHandle: "",
  facebookHandle: "",
  primaryColor: "#1a1a2e",
  secondaryColor: "#e8c07d",
  accentColor: "#ffffff",
  fontPrimary: "Playfair Display",
  fontSecondary: "Montserrat",
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadBrands() {
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      setBrands(data.brands || []);
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBrands(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setForm({
      name: brand.name,
      tagline: brand.tagline || "",
      website: brand.website || "",
      phone: brand.phone || "",
      email: brand.email || "",
      address: brand.address || "",
      instagramHandle: brand.instagramHandle || "",
      facebookHandle: brand.facebookHandle || "",
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      accentColor: brand.accentColor,
      fontPrimary: "Playfair Display",
      fontSecondary: "Montserrat",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Brand name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/brands/${editing.id}` : "/api/brands";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      toast.success(editing ? "Brand updated!" : "Brand created!");
      setShowModal(false);
      loadBrands();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete brand "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/brands/${id}`, { method: "DELETE" });
      toast.success("Brand deleted");
      loadBrands();
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">Brand Profiles</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Configure your brand identity for consistent poster generation
            </p>
          </div>
          <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
            New Brand
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <div className="skeleton h-5 w-32 rounded" />
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-8 w-full rounded mt-4" />
              </Card>
            ))}
          </div>
        ) : brands.length === 0 ? (
          <EmptyState
            icon={<Building2 className="w-5 h-5" />}
            title="No brands yet"
            description="Create your first brand profile to start generating branded posters."
            action={
              <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
                Create Brand
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Card key={brand.id} className="p-5 space-y-4 group">
                {/* Color swatches */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg border border-white/20 shadow-lg flex-shrink-0"
                    style={{ backgroundColor: brand.primaryColor }}
                  />
                  <div
                    className="w-6 h-6 rounded border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: brand.secondaryColor }}
                  />
                  <div
                    className="w-4 h-4 rounded border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: brand.accentColor }}
                  />
                  <div className="flex-1" />
                  <Badge variant="default">{brand._count?.generations || 0} posters</Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-base">{brand.name}</h3>
                  {brand.tagline && (
                    <p className="text-xs text-slate-500 mt-0.5 italic">"{brand.tagline}"</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  {brand.website && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{brand.website}</span>
                    </div>
                  )}
                  {brand.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{brand.phone}</span>
                    </div>
                  )}
                  {brand.instagramHandle && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Instagram className="w-3 h-3 flex-shrink-0" />
                      <span>{brand.instagramHandle}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(brand)}
                    icon={<Edit className="w-3 h-3" />}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(brand.id, brand.name)}
                    icon={<Trash2 className="w-3 h-3" />}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit: ${editing.name}` : "Create Brand Profile"}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Brand Name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Skyline Builders"
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Tagline"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Your building legacy"
              />
            </div>
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://yourbrand.com"
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210"
            />
            <Input
              label="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="hello@yourbrand.com"
            />
            <Input
              label="Instagram Handle"
              value={form.instagramHandle}
              onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
              placeholder="@yourbrand"
            />
            <div className="col-span-2">
              <Textarea
                label="Address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Office address..."
                rows={2}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
              Brand Colors
            </p>
            <div className="grid grid-cols-3 gap-4">
              <ColorInput
                label="Primary"
                value={form.primaryColor}
                onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
              />
              <ColorInput
                label="Secondary"
                value={form.secondaryColor}
                onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
              />
              <ColorInput
                label="Accent"
                value={form.accentColor}
                onChange={(v) => setForm((f) => ({ ...f, accentColor: v }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            {editing ? "Save Changes" : "Create Brand"}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
