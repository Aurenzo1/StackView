@echo off
setlocal
set INTERFACE=Ethernet 2

rem Utilise PowerShell pour obtenir l'état de l'interface
for /f %%s in ('powershell -Command "(Get-NetAdapter -Name \"%INTERFACE%\" | Select-Object -ExpandProperty Status)"') do (
    set STATUS=%%s
)

echo Etat detecte : [%STATUS%]

if /I "%STATUS%"=="Up" (
    echo Désactivation de %INTERFACE%...
    netsh interface set interface "%INTERFACE%" admin=disable
) else (
    echo Activation de %INTERFACE%...
    netsh interface set interface "%INTERFACE%" admin=enable
)
pause
