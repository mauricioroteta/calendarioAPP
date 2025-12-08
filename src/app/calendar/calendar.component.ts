import { Component, OnInit, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService, KeyDate } from './calendar.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    keyDate?: KeyDate;
}

@Component({
    selector: 'app-calendar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.css'],
    animations: [
        trigger('slideAnimation', [
            transition('* => *', [
                group([
                    query(':enter', [
                        style({ transform: 'translateX({{enterStart}}%) scale(0.8)', opacity: 0, position: 'absolute', width: '100%', filter: 'blur(10px)' }),
                        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0) scale(1)', opacity: 1, filter: 'blur(0)' }))
                    ], { optional: true }),
                    query(':leave', [
                        style({ transform: 'translateX(0) scale(1)', opacity: 1, position: 'absolute', width: '100%', filter: 'blur(0)' }),
                        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX({{leaveEnd}}%) scale(0.8)', opacity: 0, filter: 'blur(10px)' }))
                    ], { optional: true })
                ])
            ], { params: { enterStart: 100, leaveEnd: -100 } })
        ])
    ]
})
export class CalendarComponent implements OnInit, OnDestroy, OnChanges {
    @Input() displayDate: Date = new Date();

    currentDate = new Date();
    days: CalendarDay[] = [];
    weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    keyDates: KeyDate[] = [];
    selectedKeyDate: KeyDate | null = null;
    animationDirection: 'left' | 'right' = 'right';
    dailyQuote: any | null = null;

    monthIndex = 0;

    private dateSubscription: Subscription | undefined;

    constructor(private calendarService: CalendarService) { }

    ngOnInit(): void {
        // Subscribe to Daily Quote
        this.calendarService.dailyQuote$.subscribe(quote => {
            console.log('Daily quote updated:', quote);
            this.dailyQuote = quote;
        });

        // Subscribe to Dates
        this.calendarService.getKeyDates().subscribe({
            next: (data) => {
                this.keyDates = data;
                this.currentDate = this.displayDate;
                this.generateCalendar();
                this.subscribeToSelectionChanges();
            },
            error: (err) => {
                console.error('Error loading dates', err);
                this.currentDate = this.displayDate;
                this.generateCalendar();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['displayDate'] && !changes['displayDate'].firstChange) {
            this.currentDate = this.displayDate;
            this.generateCalendar();
            this.monthIndex++;
        }
    }

    ngOnDestroy(): void {
        if (this.dateSubscription) {
            this.dateSubscription.unsubscribe();
        }
    }

    subscribeToSelectionChanges() {
        this.calendarService.selectedDate$.subscribe(selected => {
            this.selectedKeyDate = selected;
        });
    }

    generateCalendar(): void {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startDayEnv = firstDay.getDay();
        const startDayIndex = startDayEnv === 0 ? 6 : startDayEnv - 1;

        this.days = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            this.days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            const isToday = this.isSameDate(date, new Date());
            const keyDate = this.findKeyDate(date);

            this.days.push({
                date: date,
                isCurrentMonth: true,
                isToday: isToday,
                keyDate: keyDate
            });
        }

        const remainingCells = 42 - this.days.length;
        if (remainingCells < 42) {
            for (let i = 1; i <= remainingCells; i++) {
                this.days.push({
                    date: new Date(year, month + 1, i),
                    isCurrentMonth: false,
                    isToday: false
                });
            }
        }
    }

    private isSameDate(d1: Date, d2: Date): boolean {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    private findKeyDate(date: Date): KeyDate | undefined {
        const dateStr = date.toISOString().split('T')[0];
        return this.keyDates.find(k => k.date === dateStr);
    }

    // Modified to use Service status
    prevMonth(): void {
        this.animationDirection = 'left';
        this.calendarService.prevMonth();
    }

    // Modified to use Service status
    nextMonth(): void {
        this.animationDirection = 'right';
        this.calendarService.nextMonth();
    }

    get canGoNext(): boolean {
        return this.calendarService.canGoNext();
    }

    get canGoPrev(): boolean {
        return this.calendarService.canGoPrev();
    }


    onDateClick(day: CalendarDay): void {
        // Set daily quote for clicked day
        this.calendarService.setDailyQuote(day.date);

        // Handle event selection if exists
        if (day.keyDate) {
            this.calendarService.setSelectedDate(day.keyDate);
        } else {
            this.calendarService.setSelectedDate(null);
        }
    }

    getMonthName(): string {
        return this.currentDate.toLocaleDateString('es-ES', { month: 'long' });
    }
}
