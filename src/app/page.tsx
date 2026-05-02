"use client";

import { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  User,
  Phone,
  MapPin,
  Weight,
  Box,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Truck,
  Mail,
} from "lucide-react";

interface FormData {
  sname: string;
  sphone: string;
  saddress: string;
  semail: string;
  sbirthday: string;
  snacionality: string;
  cname: string;
  cidentity: string;
  cphone: string;
  caddress: string;
  cprovince: string;
  weight: string;
  npieces: string;
  description: string;
}

interface SubmitResult {
  success: boolean;
  trackingNumber?: string;
  shipmentId?: string;
  message: string;
  syncedToApi?: boolean;
  reserveId?: string;
}

const PROVINCIAS = [
  "PINAR DEL RIO", "ARTEMISA", "LA HABANA", "MAYABEQUE", "MATANZAS",
  "CIENFUEGOS", "VILLA CLARA", "SANCTI SPIRITUS", "CIEGO DE AVILA", "CAMAGUEY",
  "LAS TUNAS", "HOLGUIN", "GRANMA", "SANTIAGO DE CUBA", "GUANTANAMO", "ISLA DE LA JUVENTUD",
];

function toUpperCase(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  const target = e.target;
  const start = target.selectionStart;
  const end = target.selectionEnd;
  target.value = target.value.toUpperCase();
  requestAnimationFrame(() => target.setSelectionRange(start, end));
}

export default function ShipmentFormPage() {
  const [formData, setFormData] = useState<FormData>({
    sname: "", sphone: "", saddress: "", semail: "", sbirthday: "", snacionality: "",
    cname: "", cidentity: "", cphone: "", caddress: "", cprovince: "",
    weight: "", npieces: "1", description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    // Remitente
    if (!formData.sname.trim()) e.sname = "El nombre del remitente es obligatorio";
    if (!formData.sphone.trim()) e.sphone = "El telefono del remitente es obligatorio";
    if (!formData.sbirthday) e.sbirthday = "La fecha de nacimiento es obligatoria";
    if (!formData.snacionality) e.snacionality = "Seleccione el lugar de origen";
    // Destinatario
    if (!formData.cname.trim()) e.cname = "El nombre del destinatario es obligatorio";
    else if (formData.cname.trim().length < 3) e.cname = "Minimo 3 caracteres";
    if (!formData.cidentity.trim()) e.cidentity = "El carnet es obligatorio";
    else if (formData.cidentity.replace(/\s/g, "").length < 11) e.cidentity = "Minimo 11 caracteres";
    if (!formData.cphone.trim()) e.cphone = "El telefono es obligatorio";
    if (!formData.cprovince) e.cprovince = "Seleccione una provincia";
    if (!formData.weight.trim() || parseFloat(formData.weight) <= 0) e.weight = "Peso invalido";
    if (!formData.description.trim()) e.description = "Describa la mercancia";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ success: false, message: "Error de conexion. Verifique su internet." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({
      sname: "", sphone: "", saddress: "", semail: "", sbirthday: "", snacionality: "",
      cname: "", cidentity: "", cphone: "", caddress: "", cprovince: "",
      weight: "", npieces: "1", description: "",
    });
    setErrors({});
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ========== VISTA DE RESULTADO ==========
  if (result) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f766e 0%, #134e4a 50%, #1e3a5f 100%)" }}>
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-0">
            <CardContent className="pt-8 pb-8 text-center">
              {result.success ? (
                <>
                  <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: "#134e4a" }}>Solicitud Registrada</h2>

                  {result.trackingNumber && (
                    <div className="my-6 p-5 rounded-xl" style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                      <p className="text-sm font-medium mb-2" style={{ color: "#16a34a" }}>Su numero de seguimiento:</p>
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-3xl font-bold tracking-wider" style={{ color: "#0f766e" }}>{result.trackingNumber}</p>
                        <button onClick={() => handleCopy(result.trackingNumber!)} className="p-2 rounded-lg hover:bg-green-100 transition-colors" title="Copiar">
                          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-500" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {result.syncedToApi && (
                    <div className="mb-4 p-3 rounded-xl" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "#1d4ed8" }}>
                        <Truck className="w-4 h-4" />
                        <span className="font-medium">Registrado en SolvedCargo (ID: {result.reserveId})</span>
                      </div>
                    </div>
                  )}

                  <p className="text-muted-foreground mb-4">{result.message}</p>

                  <div className="p-4 rounded-xl text-left mb-6" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: "#854d0e" }}>Resumen:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "#713f12" }}>
                      <div><span className="font-medium">Remitente:</span> {formData.sname.toUpperCase()}</div>
                      <div><span className="font-medium">Tel remitente:</span> {formData.sphone}</div>
                      <div><span className="font-medium">Fecha nac remitente:</span> {formData.sbirthday || "-"}</div>
                      <div><span className="font-medium">Origen remitente:</span> {formData.snacionality || "-"}</div>
                      <div><span className="font-medium">Destinatario:</span> {formData.cname.toUpperCase()}</div>
                      <div><span className="font-medium">CI:</span> {formData.cidentity}</div>
                      <div><span className="font-medium">Tel destinatario:</span> {formData.cphone}</div>
                      <div><span className="font-medium">Provincia:</span> {formData.cprovince}</div>
                      <div><span className="font-medium">Peso:</span> {formData.weight} lb</div>
                      <div><span className="font-medium">Bultos:</span> {formData.npieces}</div>
                      <div className="col-span-2"><span className="font-medium">Mercancia:</span> {formData.description.toUpperCase()}</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-red-600">Error al registrar</h2>
                  <p className="text-muted-foreground mb-6">{result.message}</p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {result.success ? "Registrar otro envio" : "Intentar de nuevo"}
                </Button>
                {result.success && (
                  <Button onClick={() => window.print()} className="text-white gap-2" style={{ background: "linear-gradient(135deg, #0f766e, #134e4a)" }}>
                    <FileText className="w-4 h-4" />Imprimir comprobante
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <footer className="text-center py-4 text-white/60 text-sm">Chambatina Miami &mdash; Registro de Envios</footer>
      </div>
    );
  }

  // ========== VISTA DEL FORMULARIO ==========
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0f766e 0%, #134e4a 50%, #1e3a5f 100%)" }}>
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
            <img src="/logo-chambatina.png" alt="Chambatina" className="w-10 h-10 object-contain" />
          </div>
          <div className="text-white">
            <h1 className="text-xl font-bold tracking-tight">Chambatina Miami</h1>
            <p className="text-white/70 text-sm">Registro de Envios</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Info Banner */}
          <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-teal-300 mt-0.5 flex-shrink-0" />
              <div className="text-white/90 text-sm">
                <p className="font-medium mb-1">Complete el formulario para registrar su envio</p>
                <p className="text-white/60">Los campos con (*) son obligatorios. Todo se guarda en MAYUSCULAS automaticamente.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ===== SECCION 1: DATOS DEL REMITENTE (EMBARCADOR) ===== */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #b45309, #d97706)" }}>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-white" />
                  <CardTitle className="text-white text-lg">Datos del Remitente</CardTitle>
                </div>
                <CardDescription className="text-white/70">Quien envia el paquete desde Miami</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sname" className="text-sm font-medium">Nombre completo del remitente *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="sname" placeholder="Ej: JUAN PEREZ GARCIA" className="pl-10" value={formData.sname}
                      onChange={(e) => { toUpperCase(e); updateField("sname", e.target.value); }} style={{ textTransform: "uppercase" }} />
                  </div>
                  {errors.sname && <p className="text-red-500 text-xs">{errors.sname}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sphone" className="text-sm font-medium">Telefono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="sphone" placeholder="Ej: +1 7865551234" className="pl-10" value={formData.sphone}
                        onChange={(e) => { toUpperCase(e); updateField("sphone", e.target.value); }} style={{ textTransform: "uppercase" }} />
                    </div>
                    {errors.sphone && <p className="text-red-500 text-xs">{errors.sphone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semail" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="semail" type="email" placeholder="Ej: juan@email.com" className="pl-10" value={formData.semail}
                        onChange={(e) => updateField("semail", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saddress" className="text-sm font-medium">Direccion del remitente</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea id="saddress" placeholder="Ej: 123 NW 42ND ST, MIAMI FL 33125" className="pl-10 resize-none" rows={2}
                      value={formData.saddress} onChange={(e) => { toUpperCase(e); updateField("saddress", e.target.value); }} style={{ textTransform: "uppercase" }} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sbirthday" className="text-sm font-medium">Fecha de nacimiento del remitente *</Label>
                    <div className="relative">
                      <Input id="sbirthday" type="date" className="w-full" value={formData.sbirthday}
                        onChange={(e) => updateField("sbirthday", e.target.value)} max={new Date().toISOString().split("T")[0]} />
                    </div>
                    {errors.sbirthday && <p className="text-red-500 text-xs">{errors.sbirthday}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="snacionality" className="text-sm font-medium">Lugar de origen (pais) *</Label>
                    <Select value={formData.snacionality} onValueChange={(val) => updateField("snacionality", val)}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Seleccione el pais" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="CUB">CUB</SelectItem>
                        <SelectItem value="VENEZUELA">VENEZUELA</SelectItem>
                        <SelectItem value="COLOMBIA">COLOMBIA</SelectItem>
                        <SelectItem value="MEXICO">MEXICO</SelectItem>
                        <SelectItem value="REPUBLICA DOMINICANA">REPUBLICA DOMINICANA</SelectItem>
                        <SelectItem value="PANAMA">PANAMA</SelectItem>
                        <SelectItem value="NICARAGUA">NICARAGUA</SelectItem>
                        <SelectItem value="HONDURAS">HONDURAS</SelectItem>
                        <SelectItem value="ECUADOR">ECUADOR</SelectItem>
                        <SelectItem value="PERU">PERU</SelectItem>
                        <SelectItem value="ESPANA">ESPANA</SelectItem>
                        <SelectItem value="ITALIA">ITALIA</SelectItem>
                        <SelectItem value="OTRO">OTRO</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.snacionality && <p className="text-red-500 text-xs">{errors.snacionality}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===== SECCION 2: DATOS DEL DESTINATARIO (CONSIGNATARIO) ===== */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-white" />
                  <CardTitle className="text-white text-lg">Datos del Destinatario</CardTitle>
                </div>
                <CardDescription className="text-white/70">Quien recibe el envio en Cuba</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cname" className="text-sm font-medium">Nombre completo del destinatario *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="cname" placeholder="Ej: MARIA GARCIA RODRIGUEZ" className="pl-10" value={formData.cname}
                      onChange={(e) => { toUpperCase(e); updateField("cname", e.target.value); }} style={{ textTransform: "uppercase" }} />
                  </div>
                  {errors.cname && <p className="text-red-500 text-xs">{errors.cname}</p>}
                  <p className="text-xs text-muted-foreground">Como aparece en el carnet de identidad (nombre y ambos apellidos)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidentity" className="text-sm font-medium">Carnet de identidad *</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="cidentity" placeholder="Ej: 89070834296" className="pl-10" value={formData.cidentity}
                        onChange={(e) => { toUpperCase(e); updateField("cidentity", e.target.value); }} maxLength={11} style={{ textTransform: "uppercase" }} />
                    </div>
                    {errors.cidentity && <p className="text-red-500 text-xs">{errors.cidentity}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cphone" className="text-sm font-medium">Telefono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="cphone" placeholder="Ej: +53 55551234" className="pl-10" value={formData.cphone}
                        onChange={(e) => { toUpperCase(e); updateField("cphone", e.target.value); }} style={{ textTransform: "uppercase" }} />
                    </div>
                    {errors.cphone && <p className="text-red-500 text-xs">{errors.cphone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ===== SECCION 3: DIRECCION DE ENTREGA ===== */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)" }}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
                  <CardTitle className="text-white text-lg">Direccion de Entrega</CardTitle>
                </div>
                <CardDescription className="text-white/70">Donde se entregara el envio en Cuba</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Provincia *</Label>
                  <Select value={formData.cprovince} onValueChange={(val) => updateField("cprovince", val)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Seleccione la provincia" /></SelectTrigger>
                    <SelectContent>{PROVINCIAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.cprovince && <p className="text-red-500 text-xs">{errors.cprovince}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caddress" className="text-sm font-medium">Direccion detallada</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Textarea id="caddress" placeholder="Ej: CALLE 5 #123 ENTRE 10 Y 12, REPARTO VISTA ALEGRE" className="pl-10 resize-none" rows={3}
                      value={formData.caddress} onChange={(e) => { toUpperCase(e); updateField("caddress", e.target.value); }} style={{ textTransform: "uppercase" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Calle, numero, entre que calles, reparto y referencia</p>
                </div>
              </CardContent>
            </Card>

            {/* ===== SECCION 4: DATOS DEL ENVIO ===== */}
            <Card className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #14b8a6, #2dd4bf)" }}>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-white" />
                  <CardTitle className="text-white text-lg">Datos del Envio</CardTitle>
                </div>
                <CardDescription className="text-white/70">Informacion sobre el paquete</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">Peso (lb) *</Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="weight" type="number" step="0.1" min="0.1" placeholder="Ej: 5.0" className="pl-10" value={formData.weight}
                        onChange={(e) => updateField("weight", e.target.value)} />
                    </div>
                    {errors.weight && <p className="text-red-500 text-xs">{errors.weight}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="npieces" className="text-sm font-medium">Cantidad de bultos</Label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="npieces" type="number" min="1" placeholder="1" className="pl-10" value={formData.npieces}
                        onChange={(e) => updateField("npieces", e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Descripcion de la mercancia *</Label>
                  <Textarea id="description" placeholder="Ej: ROPA, CALZADO, PRODUCTOS DE ASEO PERSONAL" className="resize-none" rows={3}
                    value={formData.description} onChange={(e) => { toUpperCase(e); updateField("description", e.target.value); }} style={{ textTransform: "uppercase" }} />
                  {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                  <p className="text-xs text-muted-foreground">Describa el contenido del envio de forma general</p>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" disabled={isSubmitting}
              className="w-full h-14 text-lg font-semibold text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #0f766e, #134e4a)" }}>
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Registrando envio...</>
              ) : (
                <><Package className="w-5 h-5 mr-2" />Registrar Envio</>
              )}
            </Button>

            <p className="text-center text-white/50 text-xs">
              Al enviar, los datos se guardaran en Chambatina Miami y SolvedCargo.<br />
              Todos los textos se guardan en MAYUSCULAS automaticamente.
            </p>
          </form>
        </div>
      </main>

      <footer className="text-center py-4 text-white/60 text-sm">
        Chambatina Miami &mdash; Registro de Envios &mdash; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
