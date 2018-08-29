import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable( {
    providedIn: 'root'
} )
export class DownloadService {

    constructor( private http: HttpClient ) { }

    searchVideo( search: string, nextPage: string ) {
        let url = `http://localhost:3000/search/${search}`;
        if ( nextPage ) {
            url = `${url}/${nextPage}`;
        }
        return this.http.get( url );
    }

    getData( videoId: string ) {
        const url = `http://localhost:3000/download/${videoId}`;
        return this.http.get( url );
    }
}
