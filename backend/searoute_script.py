import sys
import json
import searoute as sr


def main():
    if len(sys.argv) != 3:
        print("Usage: python searoute_script.py <origin> <destination>")
        sys.exit(1)

    origin = json.loads(sys.argv[1])
    destination = json.loads(sys.argv[2])

    route = sr.searoute(origin, destination)
    print(json.dumps(route))


if __name__ == "__main__":
    main()
