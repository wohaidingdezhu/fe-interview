import { Component, type ReactNode } from 'react';
export class ReaderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p role="alert">阅读界面加载失败，请刷新后重试。<button className="text-button" onClick={() => window.location.reload()}>刷新页面</button></p> : this.props.children;
  }
}
