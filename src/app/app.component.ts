import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DownloadService } from './services/download.service';
import { Subscription } from 'rxjs';

declare var $: any;

interface Track {
    name: string;
    videoId: string;
    duration?: number;
    audioFile?: string;
}

interface TrackSubscription {
    videoId: string;
    subscription: Subscription;
}

@Component( {
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [ './app.component.css' ]
} )
export class AppComponent implements OnInit {
    @ViewChild( 'scroll' ) scroll: ElementRef;
    search = '';
    index = 0;
    nextPage: string;
    loadingNextPage = false;
    playing = false;
    isReady = false;
    tracks: Track[] = [];
    npAction = 'En pausa...';
    npTitle: string;
    audio: HTMLAudioElement;
    trackCount: number;
    trackSubscriptions: TrackSubscription[] = [];

    constructor( private downloadService: DownloadService ) {}

    ngOnInit() {
        this.audio = <HTMLAudioElement>document.getElementById( 'audio1' );

        this.audio.addEventListener( 'play', ( evt ) => {
            // console.log( evt );
            this.playing = true;
            this.npAction = 'Reproduciendo...';
            if ( !this.isReady ) {
                this.getFirstReady();
            }
        } );

        this.audio.addEventListener( 'pause', () => {
            this.playing = false;
            this.npAction = 'En pausa...';
        } );

        this.audio.addEventListener( 'ended', () => {
            this.npAction = 'En pausa...';

            if ( ( this.index + 1 ) < this.trackCount ) {
                this.index++;
                this.loadTrack( this.index );
                this.audio.play();
            } else {
                this.audio.pause();
                this.index = 0;
                this.loadTrack( this.index );
            }
        } );

        if ( this.existsTracks() ) {
            this.loadTrack( 0 );

            setTimeout( () => {
                this.audio.play();
            }, 3000 );
        }
    }

    scrollHandler( e: any ) {
        let scroll = e.srcElement.offsetHeight + e.srcElement.scrollTop;

        if ( scroll >= e.srcElement.scrollHeight * 0.8 && !this.loadingNextPage ) {
            this.loadingNextPage = true;
            this.searchVideo();
        }
    }

    cursorFocus() {
        let i = this.index;
        if ( i < 4 ) {
            i = 0;
        } else {
            i -= 5;
        }
        this.scroll.nativeElement.scrollTop = i * 48;
    }

    getFirstReady() {
        const interval = setInterval( () => {
            const i = this.tracks.findIndex( x => x.audioFile !== undefined );
            if ( i !== -1 ) {
                this.loadTrack( i );
                clearInterval( interval );
            }
        }, 1000 );
    }

    searchVideo() {
        this.downloadService.searchVideo( this.search, this.nextPage ).subscribe( ( response: any ) => {
            console.log( response );
            this.nextPage = response.nextPage;

            if ( this.loadingNextPage ) {
                this.tracks = this.tracks.concat( response.tracks );
            } else {
                this.tracks = response.tracks;
            }

            console.log( this.tracks );
            this.loadingNextPage = false;
            this.trackCount = this.tracks.length;
            this.getAudioURL( response.tracks );
        } );
    }

    getAudioURL( tracks: Track[] ) {
        tracks.forEach( track => {
            let subs: Subscription;
            subs = this.downloadService.getData( track.videoId ).subscribe( ( response: any ) => {
                const i = this.tracks.findIndex( t => t.videoId === response.data.videoId );
                if ( i !== -1 ) {
                    this.tracks[ i ].duration = response.data.length_seconds;
                    this.tracks[ i ].audioFile = response.data.audioFile;
                    this.trackSubscriptions[ i ].subscription.unsubscribe();
                    if ( !this.isReady ) {
                        this.loadTrack( i );
                        this.isReady = true;
                    } else if ( i === 0 ) {
                        this.loadTrack( i );
                    }
                    // console.log( this.tracks[ i ] );
                }
            } );

            this.trackSubscriptions.push( {
                videoId: track.videoId,
                subscription: subs
            } );
        } );
    }

    prev() {
        if ( !this.isReady ) {
            this.getFirstReady();
        } else {
            if ( ( this.index - 1 ) > -1 ) {
                this.index--;
                this.loadTrack( this.index );
                if ( this.playing ) {
                    this.audio.play();
                }
            } else {
                this.audio.pause();
                this.index = 0;
                this.loadTrack( this.index );
            }
        }

        this.cursorFocus();
    }

    next() {
        if ( !this.isReady ) {
            this.getFirstReady();
        } else {
            if ( ( this.index + 1 ) < this.trackCount ) {
                this.index++;
                this.loadTrack( this.index );
                if ( this.playing ) {
                    this.audio.play();
                }

                if ( this.trackCount - this.index === 3 ) {
                    this.loadingNextPage = true;
                    this.searchVideo();
                }

            } else {
                this.audio.pause();
                this.index = 0;
                this.loadTrack( this.index );
            }
        }
        this.cursorFocus();
    }

    loadTrack( id ) {
        $( '.plSel' ).removeClass( 'plSel' );
        $( '#plList li:eq(' + id + ')' ).addClass( 'plSel' );
        this.npTitle = this.tracks[ id ].name;
        this.index = id;
        this.audio.src = this.tracks[ id ].audioFile;
    }

    playTrack( id ) {
        if ( this.tracks[ id ].audioFile ) {
            if ( id !== this.index || !this.playing ) {
                this.loadTrack( id );
                this.audio.play();
            }
        }
    }

    existsTracks(): boolean {
        return this.tracks.length > 0;
    }
}
