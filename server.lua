AddEventHandler('playerConnecting', function(name, setKickReason, deferrals)
    deferrals.defer()
    local player = source
    local playerName = GetPlayerName(player) or name
    local serverName = GetConvar('sv_projectName', GetConvar('sv_hostname', 'Your FiveM Server'))
    local serverConnectingMessage = Config.ServerConnectingMessage or 'Welcome, ${playerName}!'
    serverConnectingMessage = string.gsub(serverConnectingMessage, '${playerName}', playerName)
    serverConnectingMessage = string.gsub(serverConnectingMessage, '${serverName}', serverName)
    local serverInfoModulesToHandover = {}
    if Config.ServerInfoModules then
        table.sort(Config.ServerInfoModules, function(a, b)
            return (a.order or 999) < (b.order or 999)
        end)
        for _, module in ipairs(Config.ServerInfoModules) do
            if module.enabled then
                local moduleData = { type = module.type }
                if module.type == 'welcome' then
                    moduleData.playerName = playerName
                    moduleData.serverName = serverName
                    moduleData.messageTemplate = module.panelMessageTemplate or 'Hello, %s / %s'
                elseif module.type == 'playerCount' then
                    moduleData.count = #GetPlayers()
                    moduleData.prefix = module.prefix or 'Players: '
                elseif module.type == 'discordLink' or module.type == 'websiteLink' then
                    moduleData.url = module.url
                    moduleData.text = module.text
                elseif module.type == 'customText' then
                    moduleData.message = module.message
                    moduleData.style = module.style
                end
                table.insert(serverInfoModulesToHandover, moduleData)
            end
        end
    end
    deferrals.handover({
        vars = {
            playerName = playerName,
            serverName = serverName,
            playerCount = #GetPlayers()
        },
        config = {
            serverMessage = serverConnectingMessage,
            serverInfoModules = serverInfoModulesToHandover,
        }
    })
    deferrals.update(serverConnectingMessage)
    print(string.format('^2[TS Loading]^7 Initial handover data sent for %s to %s', playerName, serverName))
    SetTimeout(500, function()
        deferrals.done()
    end)
end)

Citizen.CreateThread(function()
    while true do
        Wait(Config.CountRefreshTime * 1000)
        local currentPlayers = #GetPlayers()
        TriggerClientEvent('__cfx_nui:sendNuiMessage', -1, json.encode({
            eventName = 'updatePlayerCount',
            playerCount = currentPlayers
        }))
    end
end)
