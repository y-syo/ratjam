{
  description = "a development environment for ratjam";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-24.11";
  };

  outputs = { self, flake-utils, nixpkgs, ... }:
  flake-utils.lib.eachDefaultSystem(system:
  let
    pkgs = nixpkgs.legacyPackages.${system};
  in
  {
    devShells.default = pkgs.mkShell {
	  packages = with pkgs; [ bun ];
	  buildInputs = with pkgs; [];
	  shellHook = ''
		echo -e "\x1B[0;33mentering ratjam environment...\x1B[0m"
	  '';
	};
  });
}
