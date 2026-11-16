import { Component, type ReactNode } from 'react';

type RouteBoundaryProps = { children: ReactNode; routeKey: string; unsavedBackup?: ReactNode };

export class RouteBoundary extends Component<RouteBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidUpdate(previous: Readonly<RouteBoundaryProps>) {
    if (this.state.failed && previous.routeKey !== this.props.routeKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? <section className="route-error" role="alert" aria-label="页面加载失败">
      <strong>页面暂时无法加载</strong>
      <p>刷新后可重新加载当前页面。</p>
      {this.props.unsavedBackup && <>
        <p>本次访问有尚未保存的学习记录，请先导出备份再刷新。</p>
        {this.props.unsavedBackup}
      </>}
      <button type="button" onClick={() => window.location.reload()}>刷新页面</button>
    </section> : this.props.children;
  }
}
