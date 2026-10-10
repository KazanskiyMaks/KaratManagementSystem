# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081


# This stage is used to build the service project
FROM node:22 AS node
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

COPY --from=node /usr/local /usr/local

ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["KaratManagementSystem.Server/KaratManagementSystem.Server.csproj", "KaratManagementSystem.Server/"]
COPY ["karatmanagementsystem.client/karatmanagementsystem.client.esproj", "karatmanagementsystem.client/"]
RUN dotnet restore "./KaratManagementSystem.Server/KaratManagementSystem.Server.csproj"
COPY . .
WORKDIR "/src/KaratManagementSystem.Server"
RUN dotnet build "./KaratManagementSystem.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./KaratManagementSystem.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KaratManagementSystem.Server.dll"]