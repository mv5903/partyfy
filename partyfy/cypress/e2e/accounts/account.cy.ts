context('Accounts', () => {
    before(() => {
      cy.viewport('iphone-x'); 
      cy.visit('https://partyfy.mattvandenberg.com/');
    });
  
    describe('Account Creation Flow', () => {
      it('Should complete the account creation flow', () => {
        cy.log('**Navigating to login page**');
        cy.get('a').should('have.attr', 'href', '/api/auth/login');
        cy.get('a').click();
  
        cy.log('**Logging in through Auth0**');
        cy.origin('https://' + Cypress.env('auth0_domain'), () => {
          cy.get('img[alt="Matthew\'s Auth0"]').should('be.visible');
          cy.get('input[name="username"]').type('seleniumtest1@example.com');
          cy.get('input[name="password"]').type(Cypress.env('auth0_password'));
          cy.get('button[value="default"]').click();
        });
  
        cy.log('**Entering and saving a username**');
        cy.get('h2.swal2-title').contains('enter a username');
        cy.get('input.swal2-input').click().type(Cypress.env('test_account_1_username'));
        cy.get('button.swal2-confirm').click();
  
        cy.log('**Connecting to Spotify**');
        cy.get('a').click(); // Click on the "Connect to Spotify" link
  
        // Login to Spotify
        cy.get('input#login-username').click().type('mv5903');
        cy.get('input#login-password').click().type(Cypress.env('spotify_password'));
        cy.get('button#login-button').click();
        
        // Address potential captcha
        cy.get('body').then(($body) => {
          if ($body.find('YOUR_CAPTCHA_SELECTOR').length > 0) {
            // Captcha is present
            // Handle the captcha or adjust the test flow
            // For example, you might simulate captcha solving or log a message
            cy.log('Captcha is present. Adjusting the test flow accordingly.');
            // ...additional code to handle captcha...
          } else {
            // Captcha is not present
            cy.get('button[data-testid="auth-accept"]').click();
          }
        });
        
        cy.get('button[data-testid="auth-accept"]').click(); // Confirm permissions

  
        cy.log('**Reaching the dashboard**');
        cy.get('button.btn-warning').should('be.visible');
  
        cy.log('**Deleting the account**');
        cy.get('#user-quick-action-btn').click();
        cy.get('#delete-account-btn').click();
        cy.get('button.swal2-confirm').click();
  
        cy.log('**Returning to home page after account deletion**');
        cy.get('a[href="/api/auth/login"]').should('be.visible');
      });
    });
  });
  