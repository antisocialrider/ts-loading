Config = Config or {}

Config.CountRefreshTime = 30 -- in seconds

Config.ServerConnectingMessage = 'Welcome to ${serverName}, ${playerName}!'

-- [[ Modular Server Info Panel Configuration ]] --
--- Each entry in this table represents a module that will be displayed in the top-right panel.
---- Supported 'type' values:
---- 'welcome': Displays "Welcome, [PlayerName] / [ServerName]" (or similar, based on PanelWelcomeMessageTemplate)
---- 'playerCount': Displays current player count.
---- 'discordLink': Displays a Discord icon and clickable link.
---- 'websiteLink': Displays a Website icon and clickable link.
---- 'customText': Displays a custom message.
--- Each module can have:
----  enabled (boolean): Set to true to display, false to hide.
----  order (number): Optional. Modules will be sorted by this number (lower numbers appear first).
-- If not provided, they will appear in the order they are defined here.

Config.ServerInfoModules = {{
        type = 'welcome',
        enabled = true,
        order = 10,
        panelMessageTemplate = 'Hello, %s / %s' -- %s will be replaced by player and server name
    },{
        type = 'playerCount',
        enabled = true,
        order = 20,
        -- Optional: Custom text prefix for player count
        prefix = 'Players: '
    },{
        type = 'discordLink',
        enabled = true,
        order = 30,
        url = 'https://discord.gg/yourdiscordinvite', -- REPLACE THIS WITH YOUR ACTUAL DISCORD INVITE
        text = 'Join our Discord'
    },{
        type = 'websiteLink',
        enabled = false,
        order = 40,
        url = 'https://www.yourserverwebsite.com', -- REPLACE THIS WITH YOUR ACTUAL WEBSITE URL
        text = 'Our Website'
    },{
        type = 'customText',
        enabled = true,
        order = 50,
        message = 'Thank you for joining!',
        -- Optional: You can add simple styling hints here (e.g., 'small', 'bold')
        -- style = 'italic' 
    },
    -- You can add more custom modules here following this pattern
    -- For example:
    -- {
    --     type = 'socialLink',
    --     enabled = false,
    --     order = 60,
    --     platform = 'twitter',
    --     url = 'https://twitter.com/yourserver',
    --     text = '@YourServer'
    -- },
}