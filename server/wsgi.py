from server.app import create_app

app = create_app()
app.config['DEBUG'] = False

if __name__ == "__main__":
    app.run() 