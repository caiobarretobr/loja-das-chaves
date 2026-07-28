 I want to sell a haircut scheduling App for a barber. The main idea of the app is to automate the haircut scheduling, in a way the client just accessing the app and answering some informations, don't need to talk directly with the barber. Everything under quotation marks is the brazilian portuguese text, you must maintain in portuguese BR. The interface and the layout of the app must be from up to bottom, like a water flow, in which at the time the client choses options, then the app will appearing other options based on the previous option the client choose:

- Create:
  1. First of all, the application must show two options, showing: 
      - "Serviços e Combos" | "Planos mensais"
      - In which in the "planos mensais" option, just bellow this name, there is a phrase in a smaller font written "Cansado de pagar avulso e ficar sem horários? Escolha um plano e fique sempre na régua"
  2. If the client choose the first option, then the application must follow the same, but even with this, there will be 2 open tabs(Just like a browser) in which the current tab is the "Serviços e Combos" service and the second tab is "Planos", for if the client got regret and want to choose a plan. There is the standard flow:
    2.1. Write the name and type phone number(optional) 
    2.2. Available time for that date
    2.3. Choose: Haircut | Beardcut | Both (Also the price)
    2.4. Save the client, with all this data. 
  3. BUT, if the client choose the second option, then the application will direct the client for the SECOND tab, the "planos" tab, at the time there is a first tab avaible for case the client just want to schedule a hair or beard service. From now, the flow will be:
    3.1 Show two tables.
        - First table: "Plano semanal(Máx: 4x/Mês)"
            - Description: "Dias para atendimento do plano semanal: Segunda à Domingo"
            Prices and services(Path): "/prices/plano-semanal.md"
        - Second table: "Plano econômico(Máx: 2x/mês)"
            - Description: "

APP ELEMENTS:
- App icon(Path): "/images/favicon.jpeg"
- Main poster: "/images/barbergs.png"
- Slogan(At the top of the page): "Uma nova experiência a cada corte"
- Color palletes: 
    Predominant: White
    Page details: Butter yellow/Black
- Contact (Bottom page): 
    Instagram: barber.gs
-------------------
 - The barber, with admin access, has two lists, the simple service schedules and month plans list.
 - The simple service schedules shows the name of the clien, the phone if it has typed, the type of service, the day and the hour. And when this haircut is finished, the system automatically deletes the respecitve schedule
 - And the second list is organized in items, corresponding to the clients who choose one of the plans, and when the barber click the item, it shows:
    -> Client's Name/Phone(If typed)
    -> The plan specifications (Which type)
    -> The date that the client subscribed in that plan
    -> The date when the plan is expired
    -> A checklist, in which the amount of items correspond to the type of plan the client chooses (Ex: if the client choose the weekly plan("4 vezes por mês"), then in the checklist would be 4 items).
        -> Each item in the check lists shows the possible dates the client will choose
        -> Everytime this client is done one service with the barber, then the barber will check the item to mark as done
        -> When all the items of the checklist is checked, then it automatically is deleted from the system's database

Important facts about the app:
- Responsive(Focus: phone)
- Zero costs
- Must has the simplest infrastructure
- Free tier or the cheapest database
- 100% translated to portuguese