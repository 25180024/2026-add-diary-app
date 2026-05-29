{
  description = "Diary App hands-on development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];

      forAllSystems = nixpkgs.lib.genAttrs systems;
    in {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
          };
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              # JS runtime / package manager
              nodejs_22
              pnpm

              # task runner
              just

              # utilities
              git
              jq
              curl
              unzip
              direnv

              # Expo / Firebase CLIs
              firebase-tools
              eas-cli
            ];

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
              export EXPO_NO_TELEMETRY=1

              echo ""
              echo "Nix devShell loaded"
              echo "  system : ${system}"
              echo "  pm     : pnpm"
              echo ""
              echo "Try: just start"
              echo ""
            '';
          };
        });
    };
}
