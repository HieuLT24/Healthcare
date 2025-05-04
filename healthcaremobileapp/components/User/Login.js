import { Image, ScrollView, Text, TouchableOpacity, View, Linking } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState, useEffect } from "react";
import Apis, { authApi, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/Contexts";
import qs from 'qs';

const ggClientId="404365163109-epa79qckrgvu93co2fu8q21rq9ei2uns.apps.googleusercontent.com"
    
const fbClientId="1089913789843690"


const Login = () => {
    const info = [{
        label: 'Tên đăng nhập',
        field: 'username',
        secureTextEntry: false,
        icon: "account"
    }, {
        label: 'Mật khẩu',
        field: 'password',
        secureTextEntry: true,
        icon: "eye"
    }];
    const [user, setUser] = useState({});
    const [msg, setMsg] = useState();
    const [loading, setLoading] = useState(false);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    }


    const validate = () => {
        if (Object.values(user).length === 0) {
            setMsg("Vui lòng nhập thông tin!");
            console.log("Validation failed: No user input");
            return false;
        }

        for (let i of info) {
            if (user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}`);
                console.log(`Validation failed: Missing ${i.label}`);
                return false;
            }
        }

        setMsg("");
        console.log("Validation passed");
        return true;
    };

    const login = async () => {
        if (validate() === true) {
            try {
                setLoading(true);
                console.log("Starting login process...");

                const data = {
                    ...user,
                    client_id: "XACNF8vlciv5XLCHD5mgR4fkOjl5FD9AR4axIeS3",
                    client_secret: "IDgWxpeSwUo8wwZFZIQZx5z1wyphov496QCTvhWThaPaTGgK51FaC2JqcdDtUwCejlvuar4QUB77vlSlHP1dV5jSK4YOamS882lVRwHxwMtk9FIJK68JTvYZXtyPNwWt",
                    grant_type: "password"
                };

                console.log("Sending login request with data:", data);

                let res = await Apis.post(endpoints['login'], qs.stringify(data), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                console.log("Response from server:", res.data);

                if (res.data.access_token) {
                    await AsyncStorage.setItem('token', res.data.access_token);
                    console.log("Access token saved successfully");
                } else {
                    throw new Error("Access token is missing");
                }

                let u = await authApi(res.data.access_token).get(endpoints['current-user']);
                console.info(u.data);
                dispatch({
                    "type": "login",
                    "payload": u.data
                });
                console.log("Dispatching LOGIN", u.data);
                // nav.navigate('health');
            } catch (ex) {
                console.error("Login error:", ex);
            } finally {
                setLoading(false);
                console.log("Login process completed");
            }
        }
    }

    // const socialLogin = async (provider, access_token) => {
    //     try {
    //         setLoading(true);
    //         let url = endpoints[`${provider}-login`];
    //         let res = await Apis.post(url, { access_token });
    
    //         if (res.data.access_token) {
    //             await AsyncStorage.setItem("token", res.data.access_token);
    
    //             // Lấy thông tin người dùng
    //             let userRes = await authApi(res.data.access_token).get(endpoints["current-user"]);
    //             dispatch({
    //                 type: "login",
    //                 payload: userRes.data
    //             });
    //             console.log(`${provider} login success`, userRes.data);
    //         } else {
    //             setMsg("Đăng nhập thất bại từ máy chủ");
    //         }
    
    //     } catch (err) {
    //         console.error(`Social login error (${provider}):`, err);
    //         setMsg(`Đăng nhập ${provider} thất bại`);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // const loginWithGoogle = async () => {
    //     try {
    //         const clientId = ggClientId;
    //         const redirectUrl = "exp://192.168.1.15:8082/--/oauth2redirect";
    //         const scope = encodeURIComponent('profile email');
            
    //         const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=token&scope=${scope}`;
            
    //         // Add event listener for URL changes before opening auth URL
    //         const handleUrl = ({ url }) => {
    //             console.log("Received URL:", url);
                
    //             if (url.includes('access_token=')) {
    //                 const matchToken = url.match(/access_token=([^&]+)/);
    //                 if (matchToken) {
    //                     const token = matchToken[1];
    //                     console.log("Extracted token:", token);
                        
    //                     // Remove listener before processing token
    //                     Linking.removeEventListener('url', handleUrl);
                        
    //                     // Process the token
    //                     socialLogin("google", token);
    //                 }
    //             }
    //         };

    //         // Add event listener
    //         Linking.addEventListener('url', handleUrl);
            
    //         console.log("Opening auth URL:", authUrl);
    //         await Linking.openURL(authUrl);
            
    //     } catch (error) {
    //         console.error("Google login error:", error);
    //         setMsg("Đã xảy ra lỗi khi đăng nhập Google");
    //     }
    // };

    // const loginWithFacebook = async () => {
    //     try {
    //         const redirectUri = AuthSession.makeRedirectUri({ native: 'healthcaremobileapp://redirect', useProxy: true });
    //         console.log("Facebook Redirect URI:", redirectUri);

    //         const result = await AuthSession.startAsync({
    //             authUrl:
    //                 `https://www.facebook.com/v11.0/dialog/oauth?response_type=token&client_id=${fbClientId}&` +
    //                 `redirect_uri=${encodeURIComponent(redirectUri)}&scope=email`,
    //         });

    //         if (result.type === "success" && result.params?.access_token) {
    //             await socialLogin("facebook", result.params.access_token);
    //         } else {
    //             console.error("Facebook login failed:", result);
    //             setMsg("Đăng nhập Facebook thất bại");
    //         }
    //     } catch (error) {
    //         console.error("Facebook login error:", error);
    //         setMsg("Đã xảy ra lỗi khi đăng nhập Facebook");
    //     }
    // };

    return (
        <ScrollView style={MyStyles.p}>
            <HelperText type="error" visible={msg}>{msg}</HelperText>

            {info.map(i => <TextInput key={`Login${i.field}`} value={user[i.field]}
                onChangeText={t => setState(t, i.field)}
                label={i.label} style={MyStyles.m}
                secureTextEntry={i.secureTextEntry}
                right={<TextInput.Icon icon={i.icon} />} />)}

            <Button disabled={loading} loading={loading} onPress={login} mode="contained" style={MyStyles.m}>Đăng nhập</Button>
            <Text style={{ textAlign: 'center', margin: 20}}>Hoặc đăng nhập bằng</Text>

            <Button icon="google" mode="outlined" onPress={loginWithGoogle} style={{ marginBottom: 20}}>
                Google
            </Button>
            <Button icon="facebook" mode="outlined" onPress={loginWithFacebook} style={MyStyles.m}>
                Facebook
            </Button>
        </ScrollView>
    );
}

export default Login;