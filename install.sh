#!/bin/sh
print_usage () {                                                           ###1
  echo "Valid options are OS={debian,centos,osx} "
  echo "For example if you are running CentOS you can try:"
  printf '\tOS=centos sh install.sh'
}
npm_install () {                                                           ###1
  NPM_GLOBAL_DEPENDENCIES='jshint bower grunt-cli strongloop'

  echo "Installing npm global dependencies..."
  npm install -g $NPM_GLOBAL_DEPENDENCIES || sudo npm install -g $NPM_GLOBAL_DEPENDENCIES

  echo "Installing npm development dependencies..."
  npm install --development
}
###1 Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)
      print_usage
      exit 0
      ;;
    -d|--debug)
      set -xe
      ;;
  esac
  shift
done

###1 Determine the OS
case "$OS" in
  "debian"|"centos"|"osx")
    # accept manually set values
    ;;
  *)
    [ -n "$OS" ] && >&2 echo "Ignoring invalid OS=${OS}"
    if type uname >/dev/null 2>/dev/null; then
      case "$(uname)" in
        Darwin)
          OS="osx"
          ;;
        Linux)
          if type lsb_release >/dev/null 2>/dev/null; then
            # n.b.: lsb_release is not a default package
            case "$(lsb_release -i)" in
              *Debian)
                OS="debian"
                ;;
              *Centos)
                OS="centos"
                ;;
            esac
          elif [ -f "/etc/redhat-release" || -f "/etc/centos-release" ]; then
            OS="centos"
          elif [ -f "/etc/os-release" ]; then
            if grep debian /etc/os-release >/dev/null 2>/dev/null; then
              OS="debian"
            fi
          fi
          ;;
      esac
    fi
  ;;
esac

###1 Installation action
case "$OS" in
  "debian")
    sudo apt-get update

    echo "Installing build-essential..."
    sudo apt-get install -y build-essential

    echo "Installing Node..."
    sudo apt-get install -y npm nodejs nodejs-legacy

    npm_install
    ;;
  "centos")
    # This is tested on CentOS 7

    echo "Installing Node..."
    curl --silent --location https://rpm.nodesource.com/setup > install_node.sh
    chmod +x install_node.sh
    # XXX this is super ghetto
    sudo ./install_node.sh

    echo "Installing make dependencies"
    sudo yum install -y gcc-c++ make nodejs

    npm_install
    ;;
  "osx")
    if ! type node >/dev/null 2>/dev/null; then
      echo "Node not found. Installing node..."
      if ! type brew >/dev/null 2>/dev/null; then
        echo "This install script relies on Homebrew and it doesn't seem to be installed."
        printf "http://brew.sh\n\n"
        print_usage
        exit 4
      fi
      brew install node
    fi

    if ! type make >/dev/null 2>/dev/null; then
      echo "make doesn't seem to be installed"
      echo "You may want to install make and gcc with XCode or Homebrew."
      exit 5
    fi

    npm_install
    ;;
  *)
    echo "Unable to detect a supported operating system."
    print_usage
    exit 99
    ;;
esac
# vim: set ft=sh tw=0 ts=2 sw=2 sts=2 fdm=marker fmr=###,### et:
