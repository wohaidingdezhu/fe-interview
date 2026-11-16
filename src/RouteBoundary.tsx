import { Component, type ReactNode } from 'react';

type RouteBoundaryProps = { children: ReactNode; routeKey: string };

export class RouteBoundary extends Component<RouteBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidUpdate(previous: Readonly<RouteBoundaryProps>) {
    if (this.state.failed && previous.routeKey !== this.props.routeKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? <section className="route-error" role="alert">
      <span className="eyebrow">LOAD INTERRUPTED</span>
      <strong>页面暂时无法加载</strong>
      <p>网站可能刚刚更新，刷新后可以重新获取页面模块；已保存的学习记录不会受影响。</p>
      <button type="button" onClick={() => window.location.reload()}>刷新页面</button>
    </section> : this.props.children;
  }
}
