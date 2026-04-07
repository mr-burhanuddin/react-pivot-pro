import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Keep the details accessible in browser devtools.
    // eslint-disable-next-line no-console
    console.error("Docs app runtime error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: 24, fontFamily: "sans-serif" }}>
          <h1>Runtime error</h1>
          <p>
            The docs app failed to render. Open browser devtools for full stack
            trace.
          </p>
          <pre>{this.state.message}</pre>
        </main>
      );
    }

    return this.props.children;
  }
}
