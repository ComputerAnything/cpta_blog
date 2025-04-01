import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path="/" exact component={BlogList} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/post/:id" component={BlogPost} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;