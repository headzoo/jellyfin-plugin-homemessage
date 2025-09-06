import MessagesController from './MessagesController';

const c = new MessagesController();
c.loadMessages();

// Triggered when the user navigates away from the page.
document.addEventListener('pageshow', function (e) {
  if ((e.target as any)?.id !== 'home-message-messages-page') {
    c.destroy();
  }
});
