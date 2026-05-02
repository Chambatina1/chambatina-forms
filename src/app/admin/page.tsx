"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowLeft,
} from "lucide-react";

interface Shipment {
  id: string;
  createdAt: string;
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
  cmunicipality: string;
  weight: string;
  npieces: string;
  description: string;
  cnotes: string;
  syncedToApi?: boolean;
  shipperIdApi?: string;
  consigneeIdApi?: string;
  cpkNumber?: string;
  apiResponse?: string;
  status?: string;
}

export default function AdminPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submit");
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments || []);
      }
    } catch (e) {
      console.error("Error cargando envios:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleSync = async (shipment: Shipment) => {
    setSyncing(shipment.id);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/admin/sync/${shipment.id}`, { method: "POST" });
      const data = await res.json();
      setSyncResult({
        id: shipment.id,
        success: data.success,
        message: data.message || data.error || "Sin respuesta",
      });
      await fetchShipments();
    } catch (e) {
      setSyncResult({
        id: shipment.id,
        success: false,
        message: "Error de conexion",
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    const pending = shipments.filter((s) => !s.syncedToApi);
    if (pending.length === 0) {
      setSyncResult({ id: "all", success: false, message: "No hay envios pendientes para cargar." });
      return;
    }
    if (!confirm(`Cargar ${pending.length} envio(s) pendiente(s) a SolvedCargo?`)) return;

    setSyncingAll(true);
    setSyncResult({ id: "all", success: true, message: `Cargando 0 de ${pending.length}...` });
    let success = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i++) {
      setSyncProgress({ current: i + 1, total: pending.length, success, failed });
      setSyncResult({ id: "all", success: true, message: `Cargando ${i + 1} de ${pending.length}...` });
      try {
        const res = await fetch(`/api/admin/sync/${pending[i].id}`, { method: "POST" });
        const data = await res.json();
        if (data.success) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSyncProgress({ current: pending.length, total: pending.length, success, failed });
    setSyncResult({
      id: "all",
      success: failed === 0,
      message: failed === 0
        ? `Completado: ${success} envio(s) cargados a SolvedCargo.`
        : `Completado: ${success} exitoso(s), ${failed} fallido(s) de ${pending.length} envios.`,
    });
    await fetchShipments();
    setSyncingAll(false);
  };

  const handleDelete = async (shipment: Shipment) => {
    if (!confirm(`Eliminar envio ${shipment.id.slice(-8).toUpperCase()}?`)) return;
    setDeleting(shipment.id);
    try {
      await fetch(`/api/admin/sync/${shipment.id}`, { method: "DELETE" });
      await fetchShipments();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const getTrackingNumber = (shipment: Shipment) => {
    return `CHB-${shipment.id.slice(-8).toUpperCase()}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("es-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========== ADMIN DASHBOARD ===========
  const syncedCount = shipments.filter((s) => s.syncedToApi).length;
  const pendingCount = shipments.filter((s) => !s.syncedToApi).length;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #0f766e 0%, #134e4a 50%, #1e3a5f 100%)",
      }}
    >
      {/* Header */}
      <header className="py-4 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <img
                src="/logo-chambatina.png"
                alt="Chambatina"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="text-white">
              <h1 className="text-lg font-bold">Panel de Administracion</h1>
              <p className="text-white/60 text-xs">Chambatina Miami</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="text-xs text-white/70 hover:text-white flex items-center gap-1 mr-2">
              <Package className="w-3 h-3" /> Formulario
            </a>
            <a
              href="https://plataformachambatina.onrender.com"
              className="text-xs text-amber-200 hover:text-white flex items-center gap-1 mr-2"
            >
              <ArrowLeft className="w-3 h-3" /> Volver
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchShipments}
              className="text-white/80 hover:text-white hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refrescar
            </Button>
            <Button
              size="sm"
              onClick={handleSyncAll}
              disabled={syncingAll || pendingCount === 0}
              className="text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #0f766e, #134e4a)" }}
            >
              {syncingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {syncProgress.current}/{syncProgress.total}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Cargar Todo ({pendingCount})
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Administrar Envíos - Botón principal */}
        <button
          onClick={() => document.getElementById("envios-table")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full group cursor-pointer"
        >
          <div className="relative overflow-hidden rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-3xl" style={{ background: "linear-gradient(135deg, #0f766e 0%, #134e4a 40%, #1e3a5f 100%)" }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-white text-left">
                  <h2 className="text-2xl font-bold">Administrar Envios</h2>
                  <p className="text-white/70 text-sm mt-1">Revisar, decidir y subir envios a SolvedCargo</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {pendingCount > 0 && (
                  <div className="bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-lg">
                    {pendingCount} pendiente(s)
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronDown className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 mx-auto mb-1 text-teal-600" />
              <p className="text-2xl font-bold" style={{ color: "#134e4a" }}>
                {shipments.length}
              </p>
              <p className="text-xs text-muted-foreground">Total envios</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold text-green-700">
                {syncedCount}
              </p>
              <p className="text-xs text-muted-foreground">En SolvedCargo</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <AlertCircle className="w-6 h-6 mx-auto mb-1 text-amber-600" />
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <Upload className="w-6 h-6 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700">
                {shipments.length > 0
                  ? Math.round((syncedCount / shipments.length) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">Sincronizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Sync result banner */}
        {syncResult && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between ${
              syncResult.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  syncResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {syncResult.message}
              </span>
            </div>
            <button onClick={() => setSyncResult(null)} className="text-gray-400 hover:text-gray-600 text-lg">
              &times;
            </button>
          </div>
        )}

        {/* Shipments Table */}
        <Card id="envios-table" className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-3" style={{ background: "linear-gradient(135deg, #0f766e, #134e4a)" }}>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Envios Registrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && shipments.length === 0 ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-teal-600" />
                <p className="mt-3 text-muted-foreground text-sm">
                  Cargando envios...
                </p>
              </div>
            ) : shipments.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-300" />
                <p className="mt-3 text-muted-foreground">
                  No hay envios registrados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-xs">TRACKING</TableHead>
                      <TableHead className="font-semibold text-xs">FECHA</TableHead>
                      <TableHead className="font-semibold text-xs">DESTINATARIO</TableHead>
                      <TableHead className="font-semibold text-xs">CI</TableHead>
                      <TableHead className="font-semibold text-xs">PROVINCIA</TableHead>
                      <TableHead className="font-semibold text-xs">MUNICIPIO</TableHead>
                      <TableHead className="font-semibold text-xs">MERCANCIA</TableHead>
                      <TableHead className="font-semibold text-xs">ESTADO</TableHead>
                      <TableHead className="font-semibold text-xs text-center">ACCIONES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => {
                      const tracking = getTrackingNumber(shipment);
                      const isExpanded = expandedRow === shipment.id;
                      return (
                        <>
                          <TableRow
                            key={shipment.id}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                              shipment.syncedToApi
                                ? "bg-green-50/50"
                                : "bg-amber-50/50"
                            }`}
                            onClick={() =>
                              setExpandedRow(
                                isExpanded ? null : shipment.id
                              )
                            }
                          >
                            <TableCell className="font-mono font-bold text-sm" style={{ color: "#0f766e" }}>
                              <div className="flex items-center gap-1">
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                                {tracking}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(shipment.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {shipment.cname}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {shipment.cidentity}
                            </TableCell>
                            <TableCell className="text-xs">
                              {shipment.cprovince || "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {shipment.cmunicipality || "-"}
                            </TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">
                              {shipment.description}
                            </TableCell>
                            <TableCell>
                              {shipment.syncedToApi ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  CARGADO
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  PENDIENTE
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {/* Detail dialog */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="Ver detalle"
                                    >
                                      <Eye className="w-4 h-4 text-blue-600" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle
                                        className="text-lg font-bold"
                                        style={{ color: "#134e4a" }}
                                      >
                                        Detalle del Envio - {tracking}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Registrado el{" "}
                                        {formatDate(shipment.createdAt)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-6 mt-4">
                                      {/* Remitente */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-amber-800 bg-amber-50 px-3 py-1.5 rounded">
                                          DATOS DEL REMITENTE
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                          <p>
                                            <span className="text-muted-foreground">Nombre:</span>{" "}
                                            <span className="font-medium">{shipment.sname || "-"}</span>
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Telefono:</span>{" "}
                                            {shipment.sphone || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Email:</span>{" "}
                                            {shipment.semail || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Direccion:</span>{" "}
                                            {shipment.saddress || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Fecha nacimiento:</span>{" "}
                                            {shipment.sbirthday || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Lugar de origen:</span>{" "}
                                            {shipment.snacionality || "-"}
                                          </p>
                                        </div>
                                      </div>
                                      {/* Destinatario */}
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-sm text-teal-800 bg-teal-50 px-3 py-1.5 rounded">
                                          DATOS DEL DESTINATARIO
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                          <p>
                                            <span className="text-muted-foreground">Nombre:</span>{" "}
                                            <span className="font-medium">{shipment.cname}</span>
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">CI:</span>{" "}
                                            {shipment.cidentity}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Telefono:</span>{" "}
                                            {shipment.cphone}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Provincia:</span>{" "}
                                            {shipment.cprovince || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Municipio:</span>{" "}
                                            {shipment.cmunicipality || "-"}
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Direccion:</span>{" "}
                                            {shipment.caddress || "-"}
                                          </p>
                                        </div>
                                      </div>
                                      {/* Envio */}
                                      <div className="space-y-2 col-span-2">
                                        <h4 className="font-semibold text-sm bg-gray-100 px-3 py-1.5 rounded">
                                          DATOS DEL ENVIO
                                        </h4>
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                          <p>
                                            <span className="text-muted-foreground">Peso:</span>{" "}
                                            <span className="font-medium">{shipment.weight} lb</span>
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Bultos:</span>{" "}
                                            <span className="font-medium">{shipment.npieces}</span>
                                          </p>
                                          <p>
                                            <span className="text-muted-foreground">Mercancia:</span>{" "}
                                            <span className="font-medium">{shipment.description}</span>
                                          </p>
                                        </div>
                                        {shipment.cnotes && (
                                          <p className="text-sm mt-2">
                                            <span className="text-muted-foreground">Notas:</span>{" "}
                                            {shipment.cnotes}
                                          </p>
                                        )}
                                      </div>
                                      {/* API Status */}
                                      {shipment.syncedToApi && (
                                        <div className="col-span-2 p-3 rounded-lg bg-green-50 border border-green-200">
                                          <h4 className="font-semibold text-sm text-green-800 mb-1">
                                            ESTADO SOLVEDCARGO
                                          </h4>
                                          <p className="text-xs text-green-700">
                                            Shipper ID: {shipment.shipperIdApi || "-"}
                                          </p>
                                          <p className="text-xs text-green-700">
                                            Consignee ID: {shipment.consigneeIdApi || "-"}
                                          </p>
                                          <p className="text-xs text-green-700">
                                            Reserve ID: {shipment.cpkNumber || "-"}
                                          </p>
                                          <p className="text-xs text-green-700 mt-1">
                                            {shipment.apiResponse || ""}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    {/* Action buttons in dialog */}
                                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                      {!shipment.syncedToApi && (
                                        <Button
                                          onClick={() =>
                                            handleSync(shipment)
                                          }
                                          disabled={syncing === shipment.id}
                                          className="text-white font-semibold"
                                          style={{
                                            background:
                                              "linear-gradient(135deg, #0f766e, #134e4a)",
                                          }}
                                        >
                                          {syncing === shipment.id ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                              Cargando...
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="w-4 h-4 mr-1" />
                                              Cargar a SolvedCargo
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Sync button */}
                                {!shipment.syncedToApi && (
                                  <Button
                                    onClick={() => handleSync(shipment)}
                                    disabled={syncing === shipment.id}
                                    size="sm"
                                    className="h-8 text-white text-xs font-semibold"
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #0f766e, #134e4a)",
                                    }}
                                    title="Cargar a SolvedCargo"
                                  >
                                    {syncing === shipment.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Upload className="w-4 h-4" />
                                    )}
                                  </Button>
                                )}

                                {/* Delete button */}
                                <Button
                                  onClick={() => handleDelete(shipment)}
                                  disabled={deleting === shipment.id}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Eliminar"
                                >
                                  {deleting === shipment.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Expanded row */}
                          {isExpanded && (
                            <TableRow key={`${shipment.id}-expanded`}>
                              <TableCell
                                colSpan={9}
                                className="bg-gray-50/80 p-4"
                              >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">REMITENTE</p>
                                    <p className="font-medium">{shipment.sname}</p>
                                    <p className="text-xs">{shipment.sphone}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">DIRECCION ENTREGA</p>
                                    <p className="text-xs">
                                      {shipment.caddress || "Sin direccion"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">ENVIO</p>
                                    <p>{shipment.weight} lb / {shipment.npieces} bulto(s)</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">API</p>
                                    {shipment.syncedToApi ? (
                                      <p className="text-green-700 text-xs">
                                        ID: {shipment.cpkNumber || shipment.shipperIdApi}
                                      </p>
                                    ) : (
                                      <p className="text-amber-700 text-xs">Sin sincronizar</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-white/40 text-xs">
        Chambatina Miami &mdash; Panel de Administracion
      </footer>
    </div>
  );
}
