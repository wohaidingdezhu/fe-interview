import { createContext, useContext, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { createPortal } from 'react-dom';

export const LinkedImage = createContext(false);

const ImagePreview = ({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const position = useRef({ left: window.scrollX, top: window.scrollY });
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const previous = document.activeElement, modal = dialog.current;
    modal?.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => { modal?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={dialog} className="image-preview" aria-label="图片预览" onClose={event => {
    if (!event.currentTarget.open) { window.scrollTo({ ...position.current, behavior: 'instant' }); onClose(); }
  }}>
    <div className="image-preview-toolbar"><span>{alt || '正文配图'}</span><button disabled={failed} onClick={() => setZoomed(!zoomed)} aria-pressed={zoomed}>{zoomed ? '适应窗口' : '放大'}</button><button ref={closeButton} onClick={() => dialog.current?.close()}>关闭图片</button></div>
    <div className="image-preview-scroll" tabIndex={0} role="region" aria-label="图片内容，可滚动查看" onKeyDown={event => {
      if (!zoomed || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const movement = { ArrowLeft: [-80, 0], ArrowRight: [80, 0], ArrowUp: [0, -80], ArrowDown: [0, 80] }[event.key];
      if (movement) { event.preventDefault(); event.currentTarget.scrollBy({ left: movement[0], top: movement[1], behavior: 'instant' }); }
    }}>{failed ? <p role="alert">图片加载失败，请关闭后重试。</p> : <img src={src} alt={alt} className={zoomed ? 'is-zoomed' : ''} onError={() => setFailed(true)} />}</div>
    <p>放大后可滚动查看细节；按 Esc 或点击关闭返回正文。</p>
  </dialog>, document.body);
};

export const ArticleImage = (props: ComponentPropsWithoutRef<'img'>) => {
  const linked = useContext(LinkedImage), [open, setOpen] = useState(false);
  const image = <img {...props} loading="lazy" decoding="async" />;
  if (linked || !props.src) return image;
  return <><button type="button" className="article-image-button" aria-label={`放大图片：${props.alt || '正文配图'}`} aria-haspopup="dialog" onClick={event => {
    event.currentTarget.focus({ preventScroll: true }); setOpen(true);
  }}>{image}<span>放大查看</span></button>{open && <ImagePreview src={props.src} alt={props.alt || ''} onClose={() => setOpen(false)} />}</>;
};
