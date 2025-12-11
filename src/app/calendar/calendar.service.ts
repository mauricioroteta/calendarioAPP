import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

export interface KeyDate {
    date: string; // Format YYYY-MM-DD
    title: string;
    description: string;
    category?: 'efemeride' | 'personal' | 'standard';
}

export interface Quote {
    day: number;
    date: string;
    quote: string;
    author: string;
}

interface DateState {
    date: Date;
    isYearCover: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CalendarService {
    private dataUrl = 'assets/config/fechas.json';
    private imagesUrl = 'assets/config/imagenes.json';
    private quotesUrl = 'assets/config/citas.json';

    // State
    private currentDateStateSubject = new BehaviorSubject<DateState>({ date: new Date(), isYearCover: false });
    currentDate$ = this.currentDateStateSubject.asObservable().pipe(map(state => state.date));

    private selectedDateSubject = new BehaviorSubject<KeyDate | null>(null);
    selectedDate$ = this.selectedDateSubject.asObservable();

    // Quote State
    private quotes: Quote[] = [];
    private showQuoteSubject = new BehaviorSubject<Quote | null>(null);
    showQuote$ = this.showQuoteSubject.asObservable();

    // Daily Quote (inline display)
    private dailyQuoteSubject = new BehaviorSubject<Quote | null>(null);
    dailyQuote$ = this.dailyQuoteSubject.asObservable();

    // Store available image keys
    private availableImages: Set<string> = new Set();
    private imagesLoadedSubject = new BehaviorSubject<boolean>(false);

    constructor(private http: HttpClient) {
        // Load available images on startup to establish boundaries
        this.http.get<Record<string, string>>(this.imagesUrl).subscribe(images => {
            this.availableImages = new Set(Object.keys(images));
            this.imagesLoadedSubject.next(true);
        });

        // Load quotes
        this.http.get<Quote[]>(this.quotesUrl).subscribe(data => {
            this.quotes = data;
        });
    }

    getKeyDates(): Observable<KeyDate[]> {
        return this.http.get<KeyDate[]>(this.dataUrl);
    }

    // New: Get image for current month
    getMonthImage(): Observable<string> {
        return this.http.get<Record<string, string>>(this.imagesUrl).pipe(
            map(images => {
                const state = this.currentDateStateSubject.value;
                const key = this.generateKey(state.date, state.isYearCover);
                
                console.log('getMonthImage - date:', state.date, 'isYearCover:', state.isYearCover, 'key:', key);
                console.log('Available images:', Object.keys(images));
                console.log('Image found:', images[key]);
                
                return images[key] || 'assets/images/1.JPG';
            })
        );
    }
    
    // Check if current view is a year cover
    isYearCover(): boolean {
        return this.currentDateStateSubject.value.isYearCover;
    }

    // Helper to generate YYYYMM key
    private generateKey(date: Date, isYearCover: boolean = false): string {
        const year = date.getFullYear();
        if (isYearCover) {
            return `${year}00`;
        }
        const month = date.getMonth() + 1; // 1-based (1-12)
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        return `${year}${monthStr}`;
    }

    canGoNext(): boolean {
        if (!this.imagesLoadedSubject.value) return false;

        const state = this.currentDateStateSubject.value;
        const current = state.date;
        const currentMonth = current.getMonth();
        
        // Si estamos en una portada de año, verificar enero del mismo año
        if (state.isYearCover) {
            const janKey = this.generateKey(new Date(current.getFullYear(), 0, 1), false);
            return this.availableImages.has(janKey);
        }
        
        // Si estamos en diciembre (mes 11), verificar si existe portada del año siguiente
        if (currentMonth === 11) {
            const nextYear = current.getFullYear() + 1;
            const nextYearKey = `${nextYear}00`;
            return this.availableImages.has(nextYearKey);
        }
        
        const nextDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        const nextKey = this.generateKey(nextDate, false);
        return this.availableImages.has(nextKey);
    }

    canGoPrev(): boolean {
        if (!this.imagesLoadedSubject.value) return false;

        const state = this.currentDateStateSubject.value;
        const current = state.date;
        const currentMonth = current.getMonth();
        
        // Si estamos en una portada de año, verificar diciembre del año anterior
        if (state.isYearCover) {
            const prevDecKey = this.generateKey(new Date(current.getFullYear() - 1, 11, 1), false);
            return this.availableImages.has(prevDecKey);
        }
        
        // Si estamos en enero (mes 0), verificar si existe portada del año actual
        if (currentMonth === 0) {
            const yearCoverKey = `${current.getFullYear()}00`;
            return this.availableImages.has(yearCoverKey);
        }
        
        const prevDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        const prevKey = this.generateKey(prevDate, false);
        return this.availableImages.has(prevKey);
    }

    // State modifiers
    nextMonth() {
        if (this.canGoNext()) {
            const state = this.currentDateStateSubject.value;
            const current = state.date;
            const currentMonth = current.getMonth();
            
            console.log('nextMonth - current:', current, 'month:', currentMonth, 'isYearCover:', state.isYearCover);
            
            // Si estamos en una portada de año, ir a enero del mismo año
            if (state.isYearCover) {
                const jan = new Date(current.getFullYear(), 0, 1);
                console.log('Going from year cover to January:', jan);
                this.currentDateStateSubject.next({ date: jan, isYearCover: false });
            }
            // Si estamos en diciembre, ir a la portada del año siguiente
            else if (currentMonth === 11) {
                const nextYear = new Date(current.getFullYear() + 1, 0, 1);
                console.log('Going to year cover:', nextYear);
                this.currentDateStateSubject.next({ date: nextYear, isYearCover: true });
            } else {
                const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
                console.log('Going to next month:', next);
                this.currentDateStateSubject.next({ date: next, isYearCover: false });
            }
            this.selectedDateSubject.next(null); // Clear selection on month change
        }
    }

    prevMonth() {
        if (this.canGoPrev()) {
            const state = this.currentDateStateSubject.value;
            const current = state.date;
            const currentMonth = current.getMonth();
            
            // Si estamos en una portada de año, ir a diciembre del año anterior
            if (state.isYearCover) {
                const prevDec = new Date(current.getFullYear() - 1, 11, 1);
                this.currentDateStateSubject.next({ date: prevDec, isYearCover: false });
            }
            // Si estamos en enero, ir a la portada del año actual
            else if (currentMonth === 0) {
                const yearCover = new Date(current.getFullYear(), 0, 1);
                this.currentDateStateSubject.next({ date: yearCover, isYearCover: true });
            } else {
                const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
                this.currentDateStateSubject.next({ date: prev, isYearCover: false });
            }
            this.selectedDateSubject.next(null); // Clear selection on month change
        }
    }

    setSelectedDate(keyDate: KeyDate | null) {
        this.selectedDateSubject.next(keyDate);
        if (keyDate) {
            this.showQuoteSubject.next(null);
        }
    }

    setShowQuote(enabled: boolean, dateContext?: Date) {
        if (!enabled) {
            this.showQuoteSubject.next(null);
            return;
        }

        const targetDate = dateContext || new Date();
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Try strict match first
        let quote = this.quotes.find(q => q.date === dateStr);

        this.showQuoteSubject.next(quote || null);
    }

    setDailyQuote(date: Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        console.log('setDailyQuote called with dateStr:', dateStr);
        console.log('Available quotes:', this.quotes.length);

        const quote = this.quotes.find(q => q.date === dateStr);
        console.log('Found quote:', quote);

        this.dailyQuoteSubject.next(quote || null);
    }

    getCurrentDateValue(): Date {
        return this.currentDateStateSubject.value.date;
    }
}
