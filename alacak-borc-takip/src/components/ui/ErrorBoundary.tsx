import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Download, RefreshCw } from "lucide-react";
import { readRawData } from "@/lib/storage";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Beklenmedik bir render hatasında uygulamanın boş ekrana düşmesini engeller;
 * markalı bir kurtarma ekranı ve verileri dışa aktarma yolu sunar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hata ayıklama için konsola bırakılır; kullanıcıya ham yığın gösterilmez.
    console.error("Yakalanmayan uygulama hatası:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleExport = () => {
    try {
      const data = readRawData();
      const payload = { exportedAt: new Date().toISOString(), reason: "crash-recovery", data };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${BRAND.full} - kurtarma.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* dışa aktarma başarısız olsa da kullanıcı yenilemeyi deneyebilir */
    }
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-10 text-ink">
        <div className="card w-full max-w-md p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-payable-soft text-payable">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-extrabold text-ink">Beklenmedik bir sorun oluştu</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Uygulama beklenmeyen bir hatayla karşılaştı. Verileriniz cihazınızda saklı; aşağıdan
            yedekleyip sayfayı yenileyebilirsiniz.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button
              variant="primary"
              block
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={this.handleReload}
            >
              Sayfayı Yenile
            </Button>
            <Button
              variant="secondary"
              block
              leftIcon={<Download className="h-4 w-4" />}
              onClick={this.handleExport}
            >
              Verileri Dışa Aktar
            </Button>
          </div>

          <details className="mt-5 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-faint">
              Hata ayrıntısı
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-surface-2 p-3 text-[11px] leading-relaxed text-muted">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
