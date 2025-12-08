import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarService, KeyDate, Quote } from './calendar/calendar.service';
import { Observable, map } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

interface MonthCard {
    date: Date;
    headerImage: string;
    year: number;
    monthName: string;
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, CalendarComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: [
        trigger('cardSlide', [
            transition('* => next', [
                style({
                    transform: 'translateX(120%) rotateY(25deg) scale(0.85)',
                    opacity: 0,
                    filter: 'blur(4px)'
                }),
                animate('700ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                    style({
                        transform: 'translateX(0) rotateY(0deg) scale(1)',
                        opacity: 1,
                        filter: 'blur(0px)'
                    }))
            ]),
            transition('* => prev', [
                style({
                    transform: 'translateX(-120%) rotateY(-25deg) scale(0.85)',
                    opacity: 0,
                    filter: 'blur(4px)'
                }),
                animate('700ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                    style({
                        transform: 'translateX(0) rotateY(0deg) scale(1)',
                        opacity: 1,
                        filter: 'blur(0px)'
                    }))
            ])
        ])
    ]
})
export class AppComponent implements OnInit {
    title = 'CalendarioApp';
    selectedDate$: Observable<KeyDate | null> | undefined;
    quote$: Observable<Quote | null> | undefined;

    // Carousel state
    currentCardIndex = 0;
    animationState = 'next';
    currentMonthCard: MonthCard | null = null;

    constructor(public calendarService: CalendarService) { }

    ngOnInit() {
        this.selectedDate$ = this.calendarService.selectedDate$;
        this.quote$ = this.calendarService.showQuote$;

        // Initialize current month card
        this.updateCurrentCard();

        // Subscribe to date changes
        this.calendarService.currentDate$.subscribe(() => {
            this.updateCurrentCard();
        });
    }

    updateCurrentCard() {
        const currentDate = this.calendarService.getCurrentDateValue();
        this.calendarService.getMonthImage().subscribe(imagePath => {
            this.currentMonthCard = {
                date: currentDate,
                headerImage: imagePath,
                year: currentDate.getFullYear(),
                monthName: currentDate.toLocaleDateString('es-ES', { month: 'long' })
            };
        });
    }

    nextMonth() {
        if (this.calendarService.canGoNext()) {
            this.animationState = 'next';
            this.currentCardIndex++;
            this.calendarService.nextMonth();
        }
    }

    prevMonth() {
        if (this.calendarService.canGoPrev()) {
            this.animationState = 'prev';
            this.currentCardIndex--;
            this.calendarService.prevMonth();
        }
    }

    get canGoNext(): boolean {
        return this.calendarService.canGoNext();
    }

    get canGoPrev(): boolean {
        return this.calendarService.canGoPrev();
    }

    closeOverlay() {
        this.calendarService.setSelectedDate(null);
    }

    closeQuote() {
        this.calendarService.setShowQuote(false);
    }

    onImageError(event: any) {
        event.target.src = 'assets/images/1.JPG';
    }
}
