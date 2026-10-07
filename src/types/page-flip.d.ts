/**
 * =============================================================
 *  Fichier    : page-flip.d.ts
 *  Projet     : Kalami
 *  Description: Déclaration des types de la bibliothèque page-flip 2.0.7 (fournie sans
 *               types), limitée à ce qu'utilise la liseuse. Module ES importé directement
 *               (le point d'entrée par défaut est un paquet UMD pour navigateur).
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-09
 *  Dépendances: page-flip
 * =============================================================
 */

declare module "page-flip/dist/js/page-flip.module.js" {
  export type FlipSettings = {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    startPage?: number;
    usePortrait?: boolean;
    showCover?: boolean;
    autoSize?: boolean;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    mobileScrollSupport?: boolean;
    useMouseEvents?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    clickEventForward?: boolean;
    swipeDistance?: number;
  };

  export type FlipEvent<T> = { data: T; object: PageFlip };

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSettings);
    loadFromHTML(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    updateFromHtml(items: HTMLElement[] | NodeListOf<HTMLElement>): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    on(event: "flip", callback: (event: FlipEvent<number>) => void): PageFlip;
    on(event: "init" | "update", callback: (event: FlipEvent<{ page: number }>) => void): PageFlip;
    on(
      event: "changeOrientation" | "changeState",
      callback: (event: FlipEvent<string>) => void,
    ): PageFlip;
    off(event: string): void;
    destroy(): void;
  }
}
