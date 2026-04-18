import { Component, type ReactNode } from "react";
import Card from "./cards/Card";

type Props = {
  children: ReactNode;
  title: string;
  onRetry?: () => void;
};

type State = {
  error: Error | null;
};

class QueryErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private handleRetry = () => {
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <Card title={this.props.title}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Failed to load this section.
            </p>
            <button
              onClick={this.handleRetry}
              className="w-fit rounded-md border px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              Retry
            </button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default QueryErrorBoundary;
