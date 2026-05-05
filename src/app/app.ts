import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth.service';
import { BusinessInfoService } from './business-info.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly auth = inject(AuthService);
  protected readonly businessInfo = inject(BusinessInfoService);
  protected readonly menuOpen = signal(false);

  protected readonly navItems = [
    { label: 'About', path: '/about' },
    { label: 'Offices', path: '/offices' },
    { label: 'Hot desks', path: '/hot-desks' },
    { label: 'News & events', path: '/news-events' },
    { label: 'Directory', path: '/directory' },
    { label: 'Jobs', path: '/jobs' }
  ];

  constructor() {
    this.businessInfo.load();
    this.setupGracefulImageLoading();
  }

  protected closeMenu() {
    this.menuOpen.set(false);
  }

  protected logout() {
    this.auth.logout();
    this.closeMenu();
  }

  private setupGracefulImageLoading() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const loadedImageStorageKey = 'bmie.loadedImages';
    const loadedImageUrls = new Set<string>();
    const trackedImages = new WeakSet<HTMLImageElement>();
    const cleanupCallbacks = new Set<() => void>();

    try {
      const storedUrls = window.localStorage.getItem(loadedImageStorageKey);
      if (storedUrls) {
        JSON.parse(storedUrls).forEach((url: string) => loadedImageUrls.add(url));
      }
    } catch {
      // localStorage can be unavailable in private browsing or locked-down contexts.
    }

    const rememberLoadedImage = (image: HTMLImageElement) => {
      const imageUrl = image.currentSrc || image.src;
      if (!imageUrl) {
        return;
      }

      loadedImageUrls.add(imageUrl);

      try {
        window.localStorage.setItem(loadedImageStorageKey, JSON.stringify([...loadedImageUrls]));
      } catch {
        // The animation still works if the browser refuses storage.
      }
    };

    const trackImage = (image: HTMLImageElement) => {
      if (trackedImages.has(image)) {
        return;
      }

      trackedImages.add(image);
      image.classList.add('graceful-image');

      if (!image.hasAttribute('loading')) {
        image.loading = 'lazy';
      }

      if (!image.hasAttribute('decoding')) {
        image.decoding = 'async';
      }

      const imageUrl = image.currentSrc || image.src;
      if (imageUrl && loadedImageUrls.has(imageUrl)) {
        image.classList.add('graceful-image--loaded', 'graceful-image--instant');
        return;
      }

      const markLoaded = () => {
        rememberLoadedImage(image);
        image.classList.add('graceful-image--loaded');
      };

      if (image.complete && image.naturalWidth > 0) {
        markLoaded();
        return;
      }

      image.addEventListener('load', markLoaded, { once: true });
      image.addEventListener('error', markLoaded, { once: true });
      cleanupCallbacks.add(() => {
        image.removeEventListener('load', markLoaded);
        image.removeEventListener('error', markLoaded);
      });
    };

    const trackImagesIn = (root: ParentNode) => {
      if (root instanceof HTMLImageElement) {
        trackImage(root);
        return;
      }

      root.querySelectorAll('img').forEach((image) => trackImage(image));
    };

    trackImagesIn(this.document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element || node instanceof DocumentFragment) {
            trackImagesIn(node);
          }
        });
      }
    });

    observer.observe(this.document.body, { childList: true, subtree: true });
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      cleanupCallbacks.forEach((cleanup) => cleanup());
      cleanupCallbacks.clear();
    });
  }
}
