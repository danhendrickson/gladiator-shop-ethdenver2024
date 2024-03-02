// React
import { useContext, useEffect } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import UserContextProvider, { UserContext } from './Context';
import PlayContextProvider from './pages/PlayContext';
import { VolumeProvider } from './VolumeContext';

// Interfaces
import { UserState } from './interfaces/User.interface';

// Ionic
import {
  IonApp,
  IonRouterOutlet,
  IonTabBar,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Typeography */
import './../src/collections/cosmicmuffins/fonts/robotworld.css';
import './../src/fonts/digital-7/stylesheet.css';
import './../src/fonts/gladiator-arena/stylesheet.css';

/* Theme variables */
import './theme/variables.scss';
import './theme/foundation.scss';
import './theme/tachyons.scss';
import './../node_modules/animate.css/animate.min.css';
import './theme/space-backdrop.scss';
import './theme/animations.scss';
import './theme/custom.scss';

/** Screens */
import Home from './pages/Home';
import Play from './pages/Play';
import Lobby from './pages/Lobby';
import Leaderboard from './pages/Leaderboard';

import * as gitData from './data/latest-tag.json';
import BottomNav from './components/ui/BottomNav';
import Collection from './pages/Collection';
import Shop from './pages/Shop';

setupIonicReact();

const App: React.FC = () => {

  const history = useHistory()
  const { mode }: UserState = useContext(UserContext);
  const git: any = gitData;

  useEffect(() => {

    // Gladiator Helmet
    const asciiArt = `
                .:=::.                 
            -+*#%%%@+-==+++-.           
        =*%%@@%%%@@= :*%%-.-+=.        
      .+@@@@@@@%@+#@@%*+  :@+:.      
    :#@@@@*@@%@@@@@#@@@.=@ .@#-==:     
    =#@@@@@%*@@@@@@@#@@+.=* %%@@@%#+    
    +#*%@@@##@@@@@@#@@=-#.#%%@@=       
    .%#@=%@@@+@*@@@@#@%@+@*##@#  :%     
    %@%+@=%@@*++@@@#@%:++@*%-@=*@@     
    %%@@@+#%@@=%@@@#@%*+@+#*-#%@*%     
    .@%@%%@@%+%%:%%@##+:%*=%@@%%@*@.    
    -@@@.  .:-++=%@%*--++==:.  .@       
    -@%@:         **+*.        .%-+:    
    =#@#+=-:      ++      :--+*-+.     
    =@%@*#%@.            .@%#*#+ .     
    =@@@*+#+.             @%*#*  :     
    #@%%%*++-            =*+#= :-*     
    +@#@#=##=*+          #*+#*:--.@*    
    +@*@*-=# +-        -+.#=-*+-@*     
    :%#= .@.:+        +-:@. =#%-      
        -#*-@- #        #==@:*#-        
        .=#%*@        @*%*=.          
            :-        --              

          Brokenreality Inc.
         Gladiator ${git?.default?.tag}
    `;

    console.log(asciiArt);

  }, []);

  useEffect(() => {
  }, [ mode, history?.location?.pathname ])

  return (
    <IonApp className={`${window.location.pathname.replace('/', '')}`}>
      <IonReactRouter>
        <UserContextProvider>
          <VolumeProvider>
            <PlayContextProvider>
              <IonTabs>
                <IonRouterOutlet animated={false}>
                  <Switch>
                    <Route exact path="/">
                      <Home />
                    </Route>
                    <Route exact path="/collection">
                        <Collection />
                    </Route>
                    <Route exact path="/play">
                        <Lobby />
                    </Route>
                    <Route exact path="/play/battle">
                        <Play />
                    </Route>
                    <Route exact path="/leaderboard">
                        <Leaderboard />
                    </Route>
                    <Route exact path="/shop">
                      <Shop />
                    </Route>
                  </Switch>
                </IonRouterOutlet>
                <IonTabBar slot="bottom" className='dn'>
                </IonTabBar>
              </IonTabs>
            </PlayContextProvider>
          </VolumeProvider>
        </UserContextProvider>
      </IonReactRouter>
    </IonApp>
  )

};

export default App;
