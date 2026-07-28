# `prdv7.md`

## Application design
- Remove button "ativar lembrete" at the barber pannel

## Notifications to remember the client 1 hour before the cut
- there will be a cron job in github actions coded in a Yamel workflow file
- this file will run automatically every 30 minutes, and everytime this runs it will get access for the scheduled haircut in the client, doing this step: 1. access https://barbergs.vercel.app/ 2. Go to administer pannel 3. Put the password: barbergs49 4. Check every schedule
  - If this file finds a schedule that will be done in 65 minutes or less, it will do 2 things:
    - notify the barber via callmebott api, a message containing the name of the client, and the hour it will be attended
    - if the client of that schedule allowed browser notifications, send via browser push notiifcations a message, telling him the hour that he will be attended and telling for reaching the barbershop 5 minutes before, in portuguese