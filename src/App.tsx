import { Component, useEffect, type ReactNode } from 'react';
import { ChapterPage, Home } from './pages/Home';
import { Knowledge } from './pages/Knowledge';
import { ProblemPage } from './pages/ProblemPage';
import { Quiz } from './pages/Quiz';
import { Traps } from './pages/Traps';
import { useRoute } from './lib/router';
import { resetProgress, update, useStore, type Theme } from './lib/storage';

const NEXT: Record<Theme, Theme> = { auto: 'dark', dark: 'light', light: 'auto' };
const LABEL: Record<Theme, string> = { auto: 'Giao diện: theo máy', dark: 'Giao diện: tối', light: 'Giao diện: sáng' };
const ICON: Record<Theme, string> = { auto: '◐', dark: '☾', light: '☀' };

export default function App() {
  const { path, query } = useRoute();
  const { theme } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  let page;
  switch (path[0]) {
    case 'c':
      page = <ChapterPage n={Number(path[1])} />;
      break;
    case 'p':
      page = <ProblemPage key={path[1]} id={path[1] ?? ''} seedParam={query.get('seed')} />;
      break;
    case 'kc':
      page = <Knowledge />;
      break;
    case 'quiz':
      page = <Quiz />;
      break;
    case 'traps':
      page = <Traps />;
      break;
    default:
      page = <Home />;
  }

  return (
    <>
      <header className="topbar">
        <a href="#/" className="brand">
          <span className="logo" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <rect width="24" height="24" rx="6" />
              <path d="M6 16.5h12M6 12h12M6 7.5h12" />
            </svg>
          </span>
          IT005 Luyện tập
        </a>
        <nav className="topnav">
          <a href="#/kc">Knowledge</a>
          <a href="#/quiz">Đề 40 câu</a>
          <a href="#/traps">Bẫy</a>
        </nav>
        <button className="icon-btn" title={LABEL[theme]} aria-label={LABEL[theme]} onClick={() => update((s) => ({ ...s, theme: NEXT[theme] }))}>
          {ICON[theme]}
        </button>
      </header>
      <main>
        <ErrorBoundary key={path.join('/')}>{page}</ErrorBoundary>
      </main>
      <footer className="footer">
        <p>Nội dung theo tài liệu “IT005 – Bài tập Kurose–Ross Chương 1–3”. Đề tự sinh, không sao chép đề gốc.</p>
        <button className="link-btn" onClick={() => window.confirm('Xóa toàn bộ tiến độ đã lưu trên máy này?') && resetProgress()}>
          Xóa tiến độ
        </button>
      </footer>
    </>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page card">
        <h2>Có lỗi khi hiển thị trang này</h2>
        <p className="muted">{this.state.error.message}</p>
        <a href="#/">Về trang chủ</a>
      </div>
    );
  }
}
