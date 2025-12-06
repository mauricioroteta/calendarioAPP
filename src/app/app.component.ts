import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from './calendar/calendar.component';
import { CalendarService, KeyDate } from './calendar/calendar.service';
import { Observable, map } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, CalendarComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: [
        trigger('headerAnimation', [
            transition('* => *', [
                style({ opacity: 0 }),
                animate('500ms ease-in', style({ opacity: 1 }))
            ])
        ])
    ]
})
export class AppComponent implements OnInit {
    title = 'CalendarioApp';
    headerImage$: Observable<string> | undefined;
    selectedDate$: Observable<KeyDate | null> | undefined;
    currentYear$: Observable<number> | undefined;

    constructor(private calendarService: CalendarService) { }

    ngOnInit() {
        // Subscribe to date changes to trigger image refresh
        this.calendarService.currentDate$.subscribe(() => {
            this.headerImage$ = this.calendarService.getMonthImage();
        });

        this.currentYear$ = this.calendarService.currentDate$.pipe(
            map(date => date.getFullYear())
        );

        this.selectedDate$ = this.calendarService.selectedDate$;
    }

    closeOverlay() {
        this.calendarService.setSelectedDate(null);
    }

    onImageError(event: any) {
        // Fallback to a safe default if the specific image fails to load
        event.target.src = 'assets/images/1.JPG';
    }
}
