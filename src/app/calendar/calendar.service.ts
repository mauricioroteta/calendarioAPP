import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface KeyDate {
    date: string; // Format YYYY-MM-DD
    title: string;
    description: string;
    category?: 'efemeride' | 'personal' | 'standard';
}

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    private dataUrl = 'assets/config/fechas.json';
    private imagesUrl = 'assets/config/imagenes.json';

    // State
    private currentDateSubject = new BehaviorSubject<Date>(new Date());
    currentDate$ = this.currentDateSubject.asObservable();

    private selectedDateSubject = new BehaviorSubject<KeyDate | null>(null);
    selectedDate$ = this.selectedDateSubject.asObservable();

    // Store available image keys
    private availableImages: Set<string> = new Set();
    private imagesLoadedSubject = new BehaviorSubject<boolean>(false);

    constructor(private http: HttpClient) {
        // Load available images on startup to establish boundaries
        this.http.get<Record<string, string>>(this.imagesUrl).subscribe(images => {
            this.availableImages = new Set(Object.keys(images));
            this.imagesLoadedSubject.next(true);
        });
    }

    getKeyDates(): Observable<KeyDate[]> {
        return this.http.get<KeyDate[]>(this.dataUrl);
    }

    // New: Get image for current month
    getMonthImage(): Observable<string> {
        return this.http.get<Record<string, string>>(this.imagesUrl).pipe(
            map(images => {
                const date = this.currentDateSubject.value; // e.g. 2025-01-XX
                const key = this.generateKey(date);
                return images[key] || 'assets/images/1.JPG';
            })
        );
    }

    // Helper to generate YYYYMM key
    private generateKey(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-based (1-12)
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        return `${year}${monthStr}`;
    }

    canGoNext(): boolean {
        if (!this.imagesLoadedSubject.value) return false;

        const current = this.currentDateSubject.value;
        const nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const nextKey = this.generateKey(nextDate);

        return this.availableImages.has(nextKey);
    }

    canGoPrev(): boolean {
        if (!this.imagesLoadedSubject.value) return false;

        const current = this.currentDateSubject.value;
        const prevDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        const prevKey = this.generateKey(prevDate);

        return this.availableImages.has(prevKey);
    }

    // State modifiers
    nextMonth() {
        if (this.canGoNext()) {
            const current = this.currentDateSubject.value;
            const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            this.currentDateSubject.next(next);
            this.selectedDateSubject.next(null); // Clear selection on month change
        }
    }

    prevMonth() {
        if (this.canGoPrev()) {
            const current = this.currentDateSubject.value;
            const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
            this.currentDateSubject.next(prev);
            this.selectedDateSubject.next(null); // Clear selection on month change
        }
    }

    setSelectedDate(keyDate: KeyDate | null) {
        this.selectedDateSubject.next(keyDate);
    }

    getCurrentDateValue(): Date {
        return this.currentDateSubject.value;
    }
}
