import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JiraSignalrService {
  private hubConnection!: signalR.HubConnection;

  issuesReceived$ = new Subject<any>();
  messagesReceived$ = new Subject<string>();
  errorsReceived$ = new Subject<string>();
connectionStatus$ = new Subject<'connected' | 'disconnected' | 'reconnecting'>();

  constructor() {}

  startConnection(email: string, token: string, projectName: string, domaine: string): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7104/jiraHub')
      .withAutomaticReconnect()
      .build();

    // Ici tu peux déclencher une action : notification, tentative manuelle de reconnexion, etc.
    this.hubConnection.onreconnected(() => {
  console.log('🔄 Reconnecté à SignalR, réabonnement en cours...');
    this.connectionStatus$.next('connected');
  this.subscribeToJira(email, token, projectName, domaine);
});

this.hubConnection.onclose(error => {
  console.warn('🚫 Connexion SignalR fermée :', error);
    this.connectionStatus$.next('disconnected');

});

this.hubConnection.onreconnecting(error => {
  console.log('🔁 Tentative de reconnexion en cours...', error);
    this.connectionStatus$.next('reconnecting');


});

//
    return this.hubConnection
      .start()
      .then(() => {
        console.log('✅ SignalR connecté.');
        this.subscribeToJira(email, token, projectName, domaine);

        this.hubConnection.on('ReceiveIssues', (data) => {
          try {
            const parsedData = JSON.parse(data);
            console.log('✅ Données issues reçues et parsées :', parsedData);
            this.issuesReceived$.next(parsedData);
          } catch (error) {
            console.error('❌ Erreur lors du parsing des données issues:', error);
            this.errorsReceived$.next('Erreur de parsing des données reçues.');
          }
        });

        this.hubConnection.on('ReceiveMessage', (message) => {
          console.log('📩 Message reçu :', message);
          this.messagesReceived$.next(message);
        });

        this.hubConnection.on('ReceiveError', (error) => {
          console.error('❌ Erreur reçue :', error);
          this.errorsReceived$.next(error);
        });
      })
      .catch(err => {
        console.error('❌ Erreur lors de la connexion SignalR:', err);
        throw err;
      });

  }

  private subscribeToJira(email: string, token: string, projectName: string, domaine: string): void {
    if (!this.hubConnection) {
      console.error('❌ La connexion SignalR n\'est pas encore établie.');
      return;
    }

    this.hubConnection.invoke('SubscribeToJiraUpdates', email, token, projectName, domaine)
      .catch(err => {
        console.error('❌ Erreur lors de l\'abonnement:', err);
      });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.invoke('UnsubscribeFromJiraUpdates')
        .catch(err => console.error('❌ Erreur lors du désabonnement:', err))
        .finally(() => {
          this.hubConnection.stop()
            .then(() => console.log('🛑 SignalR déconnecté.'))
            .catch(err => console.error('❌ Erreur lors de l\'arrêt de SignalR:', err));
        });
    }
  }
}
